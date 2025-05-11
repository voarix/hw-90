import express from 'express';
import expressWs from 'express-ws';
import cors from 'cors';
import {WebSocket} from 'ws';

const app = express();
const wsInstance = expressWs(app);

const port = 8000;
app.use(cors());

const router = express.Router();
wsInstance.applyTo(router);

const connectedClient: WebSocket[] = [];

interface IncomingMessage {
    type: 'DRAWING_SEND' | 'DRAWING_NEW';
    payload: Drawing | Drawing[];
}

interface Drawing {
    x: number;
    y: number;
    color: string;
}

let currentDrawing: Drawing[] = [];

router.ws('/draw', (ws, _req) => {
    connectedClient.push(ws);

    ws.send(JSON.stringify({
        action: 'DRAWING_SEND',
        payload: currentDrawing,
    }));

    ws.on('message', (message) => {
        try {
            const decodedMessage = JSON.parse(message.toString()) as IncomingMessage;

            if (decodedMessage.type === 'DRAWING_NEW') {
                const newDrawings = Array.isArray(decodedMessage.payload) ? decodedMessage.payload : [decodedMessage.payload];
                currentDrawing.push(...newDrawings);

                newDrawings.forEach(newDrawing => {
                    connectedClient.forEach(clientWS => {
                        clientWS.send(JSON.stringify({
                            type: 'DRAWING_NEW',
                            payload: newDrawing,
                        }));
                    });
                });
            }
        } catch (e) {
            ws.send(JSON.stringify({error: "Invalid message"}));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        const index = connectedClient.indexOf(ws);
        connectedClient.splice(index, 1);
        console.log('Total connections: ', connectedClient.length);
    });
});

app.use(router);
app.listen(port, () => {
    console.log(`Server started on ${port} port!`);
});