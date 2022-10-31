import React, { useState, useEffect } from 'react';
import { PlayerMoveMode } from './gamestate'
import './Timer.css';

export default function Timer(props) { // props.playerTurn
    const [time, setTime] = useState(300);
    const [time2, setTime2] = useState(300);
    const [timerOn, setTimerOn] = useState(false);
    const [timerOn2, setTimerOn2] = useState(false);

    useEffect(() => {
        let interval = null;
        if (props.player === PlayerMoveMode.PLAYER_BLUE){
            setTimerOn(true);
            setTimerOn2(false);
        }
        if (time === 0) {
            props.onOutOfTime();
            clearInterval(interval);
        }
        else if (timerOn) {
            interval = setInterval(() => {
                setTime((time) => time - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }
    , [timerOn, time, props]);
    
    
    useEffect(() => {
        let interval = null;
        if (props.player === PlayerMoveMode.PLAYER_RED) {
            setTimerOn2(true);
            setTimerOn(false);
        }
        if (time2 === 0) {
            props.onOutOfTime();
            clearInterval(interval);
            
        }
        else if (timerOn2) {
            interval = setInterval(() => {
                setTime2((time2) => time2 - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }
    , [timerOn2, time2, props]); // this is the dependency array

    // const resetPlayer1Timer = () => {
    //     setTimerOn(false);
    //     setTime(300);
    // }
    // const resetPlayer2Timer = () => {
    //     setTimerOn2(false);
    //     setTime2(300);
    // }
    // const player1Turn = () => {
    //     setTimerOn(true);
    //     setTimerOn2(false);
    // }
    // const player2Turn = () => {
    //     setTimerOn(false);
    //     setTimerOn2(true);
    // }
    const minutes = Math.floor(time / 60); // this is the number of minutes in the time state
    const seconds = time - minutes * 60; // this is the number of seconds in the time state
    const minutes2 = Math.floor(time2 / 60); // this is the number of minutes in the time state
    const seconds2 = time2 - minutes2 * 60; // this is the number of seconds in the time state
    return (
        <div className="App">
            <div className="timer">
                <div className="time">
                    <span>{minutes < 10 ? `0${minutes}` : minutes}</span>
                    <span>:</span>
                    <span>{seconds < 10 ? `0${seconds}` : seconds}</span>
                </div>
                <div className="time-2">
                    <span>{minutes2 < 10 ? `0${minutes2}` : minutes2}</span>
                    <span>:</span>
                    <span>{seconds2 < 10 ? `0${seconds2}` : seconds2}</span>
                </div>
            </div>
        </div>
    );
}