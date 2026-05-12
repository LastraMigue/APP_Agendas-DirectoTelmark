import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import express from 'express';
import qrcodeTerminal from 'qrcode-terminal';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import cors from 'cors'; 
import fs from 'fs';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// VARIABLES GLOBALES DE ESTADO
let sock;
let latestQR = null;
let isConnected = false;

async function connectToWhatsApp() {
    console.log('🔄 Iniciando conexión a WhatsApp...');
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
            console.log('🆕 Nuevo código QR generado');
            latestQR = qr; 
            isConnected = false;
            qrcodeTerminal.generate(qr, { small: true });
        }

        if (connection === 'open') {
            console.log('✅ WhatsApp conectado');
            isConnected = true;
            latestQR = null;
        }

        if (connection === 'close') {
            isConnected = false;
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('❌ Conexión cerrada. ¿Reconectar?:', shouldReconnect);
            if (shouldReconnect) connectToWhatsApp();
        }
    });
}

// --- ENDPOINT PARA EL FRONTEND DE ADMINISTRADOR ---
app.get('/whatsapp-status', (req, res) => {
    console.log(`🔍 Consulta de estado: ${isConnected ? 'Conectado' : 'Desconectado'} | QR: ${latestQR ? 'Disponible' : 'No disponible'}`);
    res.json({
        connected: isConnected,
        qr: latestQR
    });
});

app.post('/whatsapp-logout', async (req, res) => {
    console.log('🗑️ Solicitud de cierre de sesión recibida');
    try {
        if (sock) {
            await sock.logout();
        }
        
        // Borrar carpeta de sesión para forzar nuevo QR
        if (fs.existsSync('auth_info')) {
            fs.rmSync('auth_info', { recursive: true, force: true });
        }
        
        isConnected = false;
        latestQR = null;
        
        // Reiniciar conexión para generar nuevo QR
        setTimeout(() => {
            connectToWhatsApp();
        }, 2000);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- WEBHOOK DE CITAS ---
app.post('/webhook-cita', async (req, res) => {
    try {
        const { record } = req.body;
        if (!record || !record.client_id) return res.status(400).send('Faltan datos');

        if (!isConnected) {
            console.error('❌ Intento de envío sin WhatsApp conectado');
            return res.status(503).send('WhatsApp no conectado');
        }

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

        // 4. TRATAMIENTO DE FECHA
        let fechaTexto = "A confirmar";
        let horaTexto = "A confirmar";

        if (record.start_time) {
            const fechaObj = new Date(record.start_time);
            if (!isNaN(fechaObj.getTime())) {
                fechaTexto = fechaObj.toLocaleDateString('es-ES', {
                    weekday: 'long', day: 'numeric', month: 'long'
                });
                fechaTexto = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);

                horaTexto = fechaObj.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Europe/Madrid'
                });
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

        await sock.sendMessage(`${cleanNumber}@s.whatsapp.net`, { text: mensaje });
        console.log(`🚀 Mensaje enviado a ${clientProfile.full_name}`);

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