import makeWASocket, { DisconnectReason, BufferJSON, initAuthCreds, proto } from '@whiskeysockets/baileys';
import express from 'express';
import qrcodeTerminal from 'qrcode-terminal';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// --- ADAPTADOR PERSONALIZADO PARA SUPABASE ---
async function useSupabaseAuth(sessionId) {
    const writeData = async (data, id) => {
        try {
            const str = JSON.stringify(data, BufferJSON.replacer);
            await supabase
                .from('whatsapp_sessions')
                .upsert({ id: `${sessionId}-${id}`, data: JSON.parse(str) });
        } catch (e) { console.error('Error al escribir en Supabase:', e); }
    };

    const readData = async (id) => {
        try {
            const { data } = await supabase
                .from('whatsapp_sessions')
                .select('data')
                .eq('id', `${sessionId}-${id}`)
                .single();
            return data ? JSON.parse(JSON.stringify(data.data), BufferJSON.reviver) : null;
        } catch (e) { return null; }
    };

    const removeData = async (id) => {
        try {
            await supabase.from('whatsapp_sessions').delete().eq('id', `${sessionId}-${id}`);
        } catch (e) { console.error('Error al eliminar en Supabase:', e); }
    };

    const creds = await readData('creds') || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    const { data: results } = await supabase
                        .from('whatsapp_sessions')
                        .select('id, data')
                        .in('id', ids.map(id => `${sessionId}-${type}-${id}`));

                    if (results) {
                        results.forEach(row => {
                            const originalId = row.id.replace(`${sessionId}-${type}-`, '');
                            let value = JSON.parse(JSON.stringify(row.data), BufferJSON.reviver);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[originalId] = value;
                        });
                    }
                    
                    // Asegurar que todos los ids solicitados estén en el objeto (aunque sean null)
                    ids.forEach(id => {
                        if (!data[id]) data[id] = null;
                    });

                    return data;
                },
                set: async (data) => {
                    const upserts = [];
                    const deletes = [];

                    for (const type in data) {
                        for (const id in data[type]) {
                            const value = data[type][id];
                            const fullId = `${sessionId}-${type}-${id}`;
                            if (value) {
                                const str = JSON.stringify(value, BufferJSON.replacer);
                                upserts.push({ id: fullId, data: JSON.parse(str) });
                            } else {
                                deletes.push(fullId);
                            }
                        }
                    }

                    if (upserts.length > 0) {
                        await supabase.from('whatsapp_sessions').upsert(upserts);
                    }
                    if (deletes.length > 0) {
                        await supabase.from('whatsapp_sessions').delete().in('id', deletes);
                    }
                }
            }
        },
        saveCreds: () => writeData(creds, 'creds')
    };
}

let sock;
let latestQR = null;
let isConnected = false;

async function connectToWhatsApp() {
    console.log('🔄 Conectando a WhatsApp (Persistencia Supabase)...');
    const { state, saveCreds } = await useSupabaseAuth('directo-telmark-main');

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ['DirectoTelmark', 'Chrome', '1.0.0'],
        keepAliveIntervalMs: 30000,
        shouldIgnoreJid: (jid) => isConnected && jid.includes('broadcast')
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            latestQR = qr;
            isConnected = false;
            console.log('🆕 Nuevo QR disponible para escanear');
            qrcodeTerminal.generate(qr, { small: true });
        }

        if (connection === 'open') {
            console.log('✅ WhatsApp conectado y sesión persistida');
            isConnected = true;
            latestQR = null;
        }

        if (connection === 'close') {
            isConnected = false;
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log(`❌ Conexión cerrada (${statusCode}). Reintentando: ${shouldReconnect}`);
            if (shouldReconnect) connectToWhatsApp();
        }
    });
}

// --- ENDPOINTS ---

app.get('/whatsapp-status', (req, res) => {
    res.json({
        connected: isConnected,
        qr: latestQR,
        info: isConnected ? sock?.user : null
    });
});

app.post('/whatsapp-logout', async (req, res) => {
    try {
        if (sock) {
            await sock.logout();
            sock.end();
        }
        await supabase.from('whatsapp_sessions').delete().like('id', 'directo-telmark-main-%');
        isConnected = false;
        latestQR = null;
        setTimeout(() => connectToWhatsApp(), 2000);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/webhook-cita', async (req, res) => {
    const { record } = req.body;
    console.log('📩 Webhook recibido para cita:', record?.id);

    try {
        if (!record || !record.client_id) {
            console.error('⚠️ Datos de cita incompletos');
            return res.status(400).send('Faltan datos');
        }

        if (!isConnected) {
            console.error('⚠️ WhatsApp no conectado, no se puede enviar mensaje');
            return res.status(503).send('WhatsApp no conectado');
        }

        const { data: clientProfile, error: clientError } = await supabase
            .from('profiles')
            .select('full_name, phone, role')
            .eq('id', record.client_id)
            .single();

        if (clientError || !clientProfile) {
            console.error('❌ Cliente no encontrado en profiles:', record.client_id);
            return res.status(404).send('Cliente no encontrado');
        }

        if (clientProfile.role !== 'client') return res.status(200).send('Omitido (No es cliente)');

        let nombreAgente = "Especialista asignado";
        if (record.agent_id) {
            const { data: agentProfile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', record.agent_id)
                .single();
            if (agentProfile) nombreAgente = agentProfile.full_name;
        }

        let cleanNumber = clientProfile.phone.toString().replace(/\D/g, '');
        if (cleanNumber.length === 9 && !cleanNumber.startsWith('34')) cleanNumber = '34' + cleanNumber;
        const jid = `${cleanNumber}@s.whatsapp.net`;

        let fechaTexto = "A confirmar";
        let horaTexto = "A confirmar";
        if (record.start_time) {
            const fechaObj = new Date(record.start_time);
            if (!isNaN(fechaObj.getTime())) {
                fechaTexto = fechaObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
                fechaTexto = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);
                horaTexto = fechaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
            }
        }

        const mensaje = `Estimado/a *${clientProfile.full_name}*,

Confirmamos que su cita ha sido programada con éxito en *DirectoTelmark*.

*Detalles de su reserva:*
🗓️ *Fecha:* ${fechaTexto}
⏰ *Hora:* ${horaTexto} h
👤 *Agente:* ${nombreAgente}

Si necesita realizar cualquier cambio o cancelación, por favor contáctenos con antelación.

¡Gracias por confiar en nosotros!`;

        console.log(`🚀 Enviando mensaje a ${jid}...`);
        await sock.sendMessage(jid, { text: mensaje });
        console.log(`✅ Mensaje enviado con éxito a ${clientProfile.full_name}`);
        res.status(200).json({ success: true });

    } catch (err) {
        console.error('💥 Error crítico en webhook:', err);
        res.status(500).send('Error interno');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Servidor en puerto ${PORT}`);
    connectToWhatsApp();
});