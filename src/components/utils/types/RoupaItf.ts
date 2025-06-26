import { MarcaItf } from "./MarcaItf";

export interface RoupaItf {
    id: number
    nome: string
    modelo?: { nome: string}
    ano: number
    preco: number
    destaque: boolean
    foto: string
    acessorios: string
    createdAt: string
    updatedAt: string
    marcaId: number
    marca: MarcaItf
}