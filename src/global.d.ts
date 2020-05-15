interface CreateImageBitmapOptions {
    imageOrientation?: 'none' | 'flipY';
    premultiplyAlpha?: 'none' | 'premultiply' | 'default';
    colorSpaceConversion?: 'none' | 'default';
    resizeWidth?: number;
    resizeHeight?: number;
    resizeQuality?: 'pixelated' | 'low' | 'medium' | 'high';
}

declare function createImageBitmap(image: ImageBitmapSource, options?: CreateImageBitmapOptions): Promise<ImageBitmap>;
declare function createImageBitmap(image: ImageBitmapSource, sx: number, sy: number, sw: number, sh: number, options?: CreateImageBitmapOptions): Promise<ImageBitmap>;