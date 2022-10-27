import { forwardRef, useImperativeHandle, useRef } from "react"

/**
 * @param {{
 *      children: React.ReactNode,
 * }} props
 * @param {React.RefObject} ref 
 */
export const Transformer = forwardRef(
    function Transformer({children}, ref) {
        const domRef = useRef()
        // new systems would need to be implemented if multiple
        // transforms were needed at once
        // const activeTransforms = useRef([])
        
        useImperativeHandle(ref, () => {
            return {
                translate(x, y) {
                    if (x === null) {
                        x = 0
                    }
                    if (y === null) {
                        y = 0
                    }
                    const translate = `translate(${x}px, ${y}px)`
                    for (const childElem of domRef.current.children) {
                        childElem.style['transform'] = translate
                    }
                },
            }
        }, [])

        return <div className="Transformer" ref={domRef}>
            {children}
        </div>
    }
)
export default Transformer
