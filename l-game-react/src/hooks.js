import { useRef } from 'react'

/**
 * Returns a stable reference to a constant value that
 * never changes.
 * 
 * Be careful not to include potentially stale references in
 * the `valueFactory`. For this reason, the
 * "react-hooks/exhaustive-deps" rule has been enabled on this
 * function to indicate this type of error, and the caller must
 * explicitly specify an array for the `deps` argument. While the
 * `deps` argument must be provided, it may not necessarily be
 * empty. This is allowed to avoid syntax errors for variables
 * that are actually stable references (but eslint doesn't know
 * they are stable). However, please *only* use stable references
 * in `deps`, because non-stable references *will not be updated!*
 */
export function useConstant(valueFactory, deps) {
    if (typeof deps !== "object" || !Array.isArray(deps)) {
        throw new Error("useConstant() must be provided an empty deps array!")
    }

    const isInitializedRef = useRef(false)
    let value = null
    if (!isInitializedRef.current) {
        value = valueFactory()
        isInitializedRef.current = true
    }
    const valueRef = useRef(value)
    return valueRef.current
}

/**
 * Sometimes when cloning React components, you want to
 * have a ref to some child element without destroying the
 * parent's ref to the element. This hook creates a new ref
 * to use that updates each ref passed to this hook.
 * @param  {...React.RefObject} refs 
 */
export function useMultipleRefs(...refs) {
    return (handle) => {
        for (const ref of refs) {
            if (typeof ref === "function") {
                ref(handle)
            } else {
                ref.current = handle
            }
        }
    }
}
