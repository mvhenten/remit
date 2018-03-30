module.exports = function(key, store) {
    const initialState = window.sessionStorage.getItem(key);
    
    if (initialState)
        store.setState(JSON.parse(initialState));
        
    store.observe((state) => {
        window.sessionStorage.setItem(key, JSON.stringify(state));
    });
};