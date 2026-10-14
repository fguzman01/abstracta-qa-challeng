export type PetStatus = 'available' | 'pending' | 'sold';

export interface Category {
    id: number
    name : string
}

export interface Tag{
    id:number
    name: string
}

export interface Pet{
    id : number
    name: string
    photoUrls: string[]
    status: PetStatus;
    category? : Category
    tags?: Tag[]
}