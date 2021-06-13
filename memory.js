// emscripten import method
import { _malloc, _free, getNativeTypeSize, getValue } from "./emDecoder";

export default class Memory {
    constructor(val) {
        let ptr, type, size;

        if(typeof val === "string") {
            size = getNativeTypeSize(val);
            ptr = _malloc(size);
            type = val;
        } else {
            size = val;
            ptr = _malloc(size);
            type = "*";
        }

        this.ptr = ptr;
        this.type = type;
    }

    release() {
        _free(this.ptr);
    }

    getValue(type = this.type) {
        var ptr = this.ptr;
        return getValue(ptr, type);
    }
}