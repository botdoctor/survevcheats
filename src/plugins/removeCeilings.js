export function removeCeilings() {
    // Pixi texture validity is renderer-owned state. Overriding Texture.valid or
    // Texture.prototype.textureCacheIds corrupts atlas and shader caches, so x-ray
    // deliberately fails closed until ceilings can be identified as display objects.
}
