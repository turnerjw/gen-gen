export type Pokemon = {
    id: number;
    name: string;
    type: string;
}

export type Party = {
    name: string;
    members: Pokemon[];
}

export type Pokeball = {
    type: string;
    pokemon: Pokemon | null;
}

export type APIResponse<T> = {
    data: T;
    error?: string;
}

export type UnnamedNestedExample = {
    a: string;
    b: {
        c: number;
        d: boolean;
        e: {
            f: string;
            g: number;
        }
    }
}