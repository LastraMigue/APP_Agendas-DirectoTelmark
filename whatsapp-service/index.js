import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import express from 'express';
import qrcodeTerminal from 'qrcode-terminal';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

let sock;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ['DirectoTelmark', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log('--- ESCANEA EL QR ---');
            qrcodeTerminal.generate(qr, { small: true });
        }
        if (connection === 'open') console.log('✅ WhatsApp conectado');
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) connectToWhatsApp();
        }
    });
}

app.post('/webhook-cita', async (req, res) => {
    try {
        const { record } = req.body;
        if (!record || !record.client_id) return res.status(400).send('Faltan datos');

        // 1. OBTENER DATOS DEL CLIENTE
        const { data: clientProfile } = await supabase
            .from('profiles')
            .select('full_name, phone, role')
            .eq('id', record.client_id)
            .single();

        if (!clientProfile || clientProfile.role !== 'client') return res.status(200).send('Omitido');

        // 2. OBTENER DATOS DEL AGENTE
        let nombreAgente = "Especialista asignado";
        if (record.agent_id) {
            const { data: agentProfile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', record.agent_id)
                .single();
            if (agentProfile) nombreAgente = agentProfile.full_name;
        }

        // 3. LIMPIEZA DE TELÉFONO
        let cleanNumber = clientProfile.phone.toString().replace(/\D/g, '');
        if (cleanNumber.length === 9 && !cleanNumber.startsWith('34')) cleanNumber = '34' + cleanNumber;

        // 4. TRATAMIENTO DE FECHA (Ajuste automático a España)
        let fechaTexto = "A confirmar";
        let horaTexto = "A confirmar";

        if (record.start_time) {
            // Creamos el objeto fecha. JavaScript detectará que es UTC y lo pasará a tu hora local (España)
            const fechaObj = new Date(record.start_time);

            if (!isNaN(fechaObj.getTime())) {
                // Eliminamos la línea de setHours(+2) para evitar el error de doble suma

                fechaTexto = fechaObj.toLocaleDateString('es-ES', {
                    weekday: 'long', day: 'numeric', month: 'long'
                });
                fechaTexto = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);

                horaTexto = fechaObj.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Europe/Madrid' // Forzamos explícitamente la hora de Madrid
                });
            }
        }

        // 5. MENSAJE FINAL
        const mensaje =
            `Estimado/a *${clientProfile.full_name}*,

Confirmamos que su cita ha sido programada con éxito en *DirectoTelmark*.

*Detalles de su reserva:*
🗓️ *Fecha:* ${fechaTexto}
⏰ *Hora:* ${horaTexto} h
👤 *Agente:* ${nombreAgente}

Si necesita realizar cualquier cambio o cancelación, por favor contáctenos con antelación.

¡Gracias por confiar en nosotros!`;

        await sock.sendMessage(`${cleanNumber}@s.whatsapp.net`, { text: mensaje });
        console.log(`🚀 ¡WhatsApp enviado! Cliente: ${clientProfile.full_name} | Hora: ${horaTexto}`);

        res.status(200).json({ success: true });

    } catch (err) {
        console.error('💥 Error:', err);
        res.status(500).send('Error interno');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Servidor activo en puerto ${PORT}`);
    connectToWhatsApp();
});