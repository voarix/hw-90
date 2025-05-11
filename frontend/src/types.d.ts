export interface Drawing {
    x: number;
    y: number;
    color: string;
}

export interface IncomingMessage {
    type: "DRAWING_SEND" | "DRAWING_NEW";
    payload: Drawing | Drawing[];
}