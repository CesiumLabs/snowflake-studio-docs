import Fuse from 'fuse.js';

export type Library = "canvacord" | "soundcloud" | "quickmongo" | "eco" | "discord-player";
export type ElementType = "class" | "interface" | "event" | "method" | "param" | "prop" | "typedef";
export type Element = DocClass | DocProp | DocEvent | DocTypedef | DocInterface | DocMethod | DocParam;

export interface EmbedOptions {
    excludePrivateElements?: boolean;
}

export interface Embed { 
    name: string;
    description: string;
    url?: string;
    color?: string;
    author?: {
        name: string,
        url: string,
        icon_url: string
    },
    fields: {
        name: string,
        value: string | string[]
    }[];
}

export interface ElementJSON {
    name: string;
    description: string;
    internal_type: ElementType;
    props?: string[];
    parent?: string;
    methods?: string[];
    events?: string[];
    params?: string[];
    type?: string;
    examples?: string[] | string;
    returns?: {
        type: string,
        description?: string
    };
}

class DocBase {

    public originalJSON: unknown;
    public children: Map<string, Element>;

    public constructor(json: unknown);

    readonly get classes(): DocClass[];
    readonly get props(): DocProp[];
    readonly get events(): DocEvent[];
    readonly get typedefs(): DocTypedef[];
    readonly get interfaces(): DocInterface[];
    readonly get methods(): DocMethod[];
    readonly get params(): DocParam[];

    protected addElement(child: Element);
    protected adoptAll<E, R>(enumerable: Iterable<E>, constructor: (this: DocBase, element: E) => R);
    
    public childrenOfType(type: ElementType): Element[] | null;
    public findElement(query: string, exclude?: Element[]): Element[];

}

class DocElement extends DocBase {

    readonly doc: Doc;
    readonly type: ElementType;
    readonly data: unknown;
    readonly parent?: ElementType;
    readonly name: string;
    readonly description: string;
    readonly meta: unknown;
    readonly access: "public" | "private" | "protected";
    readonly deprecated: boolean;
    readonly returns: null;
    readonly examples: null;
    readonly type: unknown[] | null;
    readonly nullable: null;
    readonly scope?: unknown;
    readonly optional?: boolean;
    readonly variable?: unknown; 

    readonly get embedPrefix(): string;
    readonly get anchor(): 's-' | 'e-' | null;
    readonly get url(): string | null;
    readonly get sourceURL(): string | null;
    readonly get formattedName(): string;
    readonly get formattedDescription(): string;
    readonly get formattedReturn(): string;
    readonly get formattedType(): string;
    readonly get formattedExtends(): string;
    readonly get formattedImplements(): string;
    readonly get link(): string;
    readonly get static(): boolean;
    readonly get typeElement(): Element | null;

    readonly static get types(): Record<Uppercase<ElementType>, ElementType>;

    public constructor(doc: Doc, type: ElementType, data: unknown, parent?: Element);

    public embed(options?: EmbedOptions): Embed[];
    public toJSON(): ElementJSON;
    public formatText(text: string): string;

    protected formatEmbed(options?: EmbedOptions);
    protected attachProps(embed: Embed, options?: EmbedOptions);
    protected attachMethods(embed: Embed, options?: EmbedOptions);
    protected attachEvents(embed: Embed);
    protected attachParams(embed: Embed);
    protected attachReturn(embed: Embed);
    protected attachType(embed: Embed);
    protected attachExamples(embed: Embed);

}

class DocClass extends DocElement {
    type: "class";
}

class DocProp extends DocElement {
    type: "prop";
}

class DocEvent extends DocElement {
    type: "event";
}

class DocTypedef extends DocElement {
    type: "typedef";
}

class DocInterface extends DocElement {
    type: "interface";
}

class DocMethod extends DocElement {
    type: "method";
}

class DocParam extends DocElement {
    type: "param";
}

class Doc extends DocBase {
    
    readonly url: string;
    readonly project: string;
    readonly repo: string;
    readonly project: string;
    readonly fuse: Fuse;

    public constructor(url: string, docs: unknown);

    readonly get repoURL(): string;
    readonly get baseURL(): string | null;
    readonly get baseDocsURL(): string | null;
    readonly get icon(): string | null;
    readonly get color(): number;

    public get(...terms: string[]): Element | null;
    public search(query: string, options?: EmbedOptions): Element[];
    public resolveEmbed(query: string, options?: EmbedOptions): Embed;
    public toFuseFormat(): { id: string, name: string }[];
    public toJSON(): Record<'classes' | 'typedefs' | 'interfaces', ElementJSON>;
    public baseEmbed(): Partial<Embed>;
    public formatType(types: string[]): string;

    public static fetch(library: Library, options?: { force: boolean }): Promise<Doc>;
    public static getRepoURL(id: string): string;
    public static sources(): unknown;

}

export = Doc;