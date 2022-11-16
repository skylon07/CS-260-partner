import { useRef, useState } from 'react'

import Board from './Board'
import FillArray from './FillArray'

import './App.css'

export default function App() {
    const [resetCount, setResetCount] = useState(0)
    const resetGame = () => {
        setResetCount((resetCount) => resetCount + 1)
    }

    return <div className="App">
        <ResettableApp
            key={resetCount}
            resetGame={resetGame}
        />
    </div>
}

function ResettableApp() {
    const fillArray = useFillArray()

    return <div className="ResettableApp">
        <Board boardShape={fillArray} />
    </div>
}

function useFillArray() {
    const fillArrayRef = useRef(null)
    if (fillArrayRef.current === null) {
        fillArrayRef.current = new FillArray(5, 8, (row, col) => (row !== 1 && row !== 3) || (col !== 2 && col !== 6))
    }
    const fillArray = fillArrayRef.current
    return fillArray
}
