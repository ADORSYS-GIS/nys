declare module 'minimatch' {
  // Add the missing interfaces that @types/glob is looking for
  export interface IOptions {
    // Minimatch options
    nobrace?: boolean;
    noglobstar?: boolean;
    dot?: boolean;
    noext?: boolean;
    nocase?: boolean;
    nonull?: boolean;
    matchBase?: boolean;
    nocomment?: boolean;
    nonegate?: boolean;
    flipNegate?: boolean;
    debug?: boolean;
    windowsPathsNoEscape?: boolean;
  }

  export interface IMinimatch {
    pattern: string;
    options: IOptions;
    match(path: string): boolean;
    matchOne(file: string[], pattern: string[]): boolean;
    makeRe(): RegExp | false;
    braceExpand(pattern: string, options?: IOptions): string[];
    parse(pattern: string, isSub?: boolean): string[];
  }
}
