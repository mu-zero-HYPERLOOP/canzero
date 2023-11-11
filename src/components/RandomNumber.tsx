import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

const numberOfElements = 10;

function RandomNumber() {
    let [number, setNumber] = useState(0);
    let [vec, setVec] = useState([0]);

    // React components are pure functions.
    // useEffects allows us to implement side effects
    // useEffects are run after react has rendered the DOM.
    // here we are using it to listen to events.
    useEffect(() => {
        // the generic argument of listen is the type of the payload.
        let unsubscribe = listen<number>("random-integer", (event) => {
            let number = event.payload;

            vec.unshift(number)
            if (vec.length > numberOfElements) {
                vec.pop();
            }
            // by calling set number we tell react to update the DOM.
            setNumber(number);
            setVec(vec);
        });
        // the lambda returned will be executed on cleanup of the effect.
        return () => {
            // unsubscribe from listeners
            unsubscribe.then(f => f());
        };
    });

    return <ul>
        {vec.map((number) => <li> {number}</li>)}
     </ul>
}

export default RandomNumber;
