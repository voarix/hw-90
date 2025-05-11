import './App.css'
import {useEffect, useRef, useState} from "react";
import type {Drawing, IncomingMessage} from "./types";

const App = () => {
    const [isDrawing, setIsDrawing] = useState(false);
    const canv = useRef<HTMLCanvasElement | null>(null);
    const ws = useRef<WebSocket | null>(null);
    const drawColor = useRef('black');

    useEffect(() => {
        ws.current = new WebSocket('ws://localhost:8000/draw');

        ws.current.onclose = () => console.log('ws closed');

        const canvas = canv.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas?.width || 800, canvas?.height || 600);

        ws.current.onmessage = (event) => {
            const decodedMessage = JSON.parse(event.data) as IncomingMessage;
            const currentCtx = canv.current?.getContext("2d");
            if (!currentCtx) return;

            if (decodedMessage.type === 'DRAWING_SEND') {
                const initialDrawing = Array.isArray(decodedMessage.payload) ? decodedMessage.payload : [decodedMessage.payload];
                drawAllDots(initialDrawing, currentCtx);
            } else if (decodedMessage.type === 'DRAWING_NEW') {
                const newDrawings = Array.isArray(decodedMessage.payload) ? decodedMessage.payload : [decodedMessage.payload];
                newDrawings.forEach(dot => drawDot(dot, currentCtx));
            }
        };

        return () => {
            if (ws.current) {
                ws.current?.close();
            }
        }
    }, []);

    const drawDot = (dot: Drawing, ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = dot.color;
        ctx.fillRect(dot.x - 2, dot.y - 2, 7, 7);
    };

    const drawAllDots = (dots: Drawing[], ctx: CanvasRenderingContext2D) => {
        dots.forEach(dot => drawDot(dot, ctx));
    };

    const sendDrawing = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        if (!ws.current) return;

        const canvas = canv.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const x = event.nativeEvent.offsetX;
        const y = event.nativeEvent.offsetY;

        const drawingPoint: Drawing = {
            x: x,
            y: y,
            color: drawColor.current,
        };

        ws.current.send(JSON.stringify({
            type: 'DRAWING_NEW',
            payload: drawingPoint,
        }));

        drawDot(drawingPoint, ctx);
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        setIsDrawing(true);
        sendDrawing(e);
    };

    const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        if (isDrawing) sendDrawing(e);
    };

    const endDrawing = () => {
        setIsDrawing(false);
    };

    const leaveCanvas = () => {
        if (isDrawing) setIsDrawing(false);
    };

    const onColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        drawColor.current = e.target.value;
    };

    return (
        <>
            <canvas
                ref={canv}
                width={800}
                height={800}
                onMouseDown={startDrawing}
                onMouseMove={onMouseMove}
                onMouseUp={endDrawing}
                onMouseLeave={leaveCanvas}
                style={{border: '7px solid gray', display: 'block', margin: '20px auto'}}
            />
            <input
                type="color"
                value={drawColor.current}
                onChange={onColorChange}
                style={{marginTop: '10px', width: '50px', height: '30px'}}
            />
        </>
    );
};

export default App;