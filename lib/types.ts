export type Cell = { id: string; type: 'text' | 'image'; content: string };
export type Row = Cell[];
export type Mode = 'quotation' | 'production' | 'shipping';
