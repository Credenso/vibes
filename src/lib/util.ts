// Generic Svelte-based helper functions

export const preload = async (src) => {
    const resp = await fetch(src);
    const blob = await resp.blob();

    return new Promise(function (resolve) {
        let reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject('Error: ', error);
    });
};

export function clickOutside(element, callbackFunction) {
    function onClick(event) {
        if (!element.contains(event.target)) {
            callbackFunction();
        }
    }

    document.body.addEventListener('click', onClick);

    return {
        update(newCallbackFunction) {
            callbackFunction = newCallbackFunction;
        },
        destroy() {
            document.body.removeEventListener('click', onClick);
        }
    }
}

export const prettyDate = (date) => {
    return `${date.toDateString().split(' ').slice(0,3).join(' ')} - ${date.toLocaleString().split(' ')[1].split(':').slice(0,2).join(":")}`
}


export const secondsToTime = (seconds) => {
    if (!seconds) return "00:00"
    let minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
    return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}
