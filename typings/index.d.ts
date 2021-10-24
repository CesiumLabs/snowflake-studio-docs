declare module "snowflake-studio-docs" {
    import type Fuse from 'fuse.js';

    export type Library = "canvacord" | "soundcloud" | "quickmongo" | "eco" | "discord-player" | "discord.js";
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

        get classes(): DocClass[];
        get props(): DocProp[];
        get events(): DocEvent[];
        get typedefs(): DocTypedef[];
        get interfaces(): DocInterface[];
        get methods(): DocMethod[];
        get params(): DocParam[];

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
        readonly nullable: null;
        readonly scope?: unknown;
        readonly optional?: boolean;
        readonly variable?: unknown;

        get embedPrefix(): string;
        get anchor(): 's-' | 'e-' | null;
        get url(): string | null;
        get sourceURL(): string | null;
        get formattedName(): string;
        get formattedDescription(): string;
        get formattedReturn(): string;
        get formattedType(): string;
        get formattedExtends(): string;
        get formattedImplements(): string;
        get link(): string;
        get static(): boolean;
        get typeElement(): Element | null;

        static get types(): Record<Uppercase<ElementType>, ElementType>;

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
        readonly fuse: Fuse<Doc, {}>;

        public constructor(url: string, docs: unknown);

        get repoURL(): string;
        get baseURL(): string | null;
        get baseDocsURL(): string | null;
        get icon(): string | null;
        get color(): number;

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

    export default Doc;
    export { Doc };
}