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
