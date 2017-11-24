const { Component } = require("preact");

const state = new WeakMap();

class StateStorage {
    constructor(key) {
        state.set(this, key);
    }

    get key() {
        return state.get(this);
    }

    get() {
        let data = window.localStorage.getItem(this.key);

        if (!data)
            return null;

        try {
            // data = JSON.parse(data);
        }
        catch (err) {
            console.error("FAILED TO PARSE", err, data);
            return null;
        }
        return data;
    }

    set(value) {
        window.localStorage.setItem(this.key, JSON.stringify(value));
    }
}

class EventManager {
    constructor(parent, style) {
        this.parent = parent;
        this.style = style;
        this.pos = 0;

        this.mousemove = this.mousemove.bind(this);
        this.mouseup = this.mouseup.bind(this);
        this.mousedown = this.mousedown.bind(this);
    }

    get children() {
        const { parent } = this;
        return [].slice.call(parent.children);
    }

    get grips() {
        const { parent } = this;
        return [].slice.call(parent.querySelectorAll(".grippy"));
    }

    get dimensions() {
        return this.style.dimensions;
    }

    set dimensions(dimensions) {
        this.style.dimensions = dimensions;
    }


    init() {
        document.addEventListener("mousemove", this.mousemove);
        document.addEventListener("mouseup", this.mouseup);
        document.addEventListener("click", this.mouseup);

        console.log("INIT");

        window.onresize = evt => {
            this.redistributeDimensions(this.parent.clientWidth);
            this.recalculateStyle();
        };

        this.grips.forEach((grip) => {
            grip.addEventListener("mousedown", this.mousedown);
        });

        this.redistributeDimensions(this.parent.clientWidth);
    }

    unmount() {
        document.removeEventListener("mousemove", this.mousemove);
        document.removeEventListener("mouseup", this.mouseup);
        document.removeEventListener("click", this.mouseup);
        window.onResize = null;

        this.grips.forEach((grip) => {
            grip.removeEventListener("mousedown", this.mousedown);
        });
    }


    recalculateDimensions(index, delta) {
        const { dimensions } = this;
        const [left, grip, right] = dimensions.slice(index - 1, index + 2);

        grip.left = grip.left + delta;

        left.width = left.width + delta;
        right.left = right.left + delta;

        right.width = right.width - delta;

        this.dimensions = dimensions;
    }

    recalculateStyle() {
        let { dimensions } = this;

        this.children.forEach((child, index) => {
            const dim = dimensions[index];

            child.style.width = dim.width + "px";
            child.style.left = dim.left + "px";
        });
    }

    redistributeDimensions(width) {
        let { dimensions } = this;

        const previousWidth = dimensions.reduce((width, dim) => width + dim.width, 0);
        const gripWidth = dimensions.reduce((width, dim, index) => {
            if (index % 2 == 1) width += dim.width;
            return width;
        }, 0);


        const scale = (width - gripWidth) / (previousWidth - gripWidth);
        let left = 0;

        dimensions.forEach((dim, index) => {
            dim.left = left;

            if (index % 2 == 1) {
                left += dim.width;
                return;
            }

            dim.width = dim.width * scale;

            left += dim.width;
        });


        this.dimensions = dimensions;
    }


    mousemove(evt) {
        if (!this.active)
            return;

        if (evt.stopPropagation) evt.stopPropagation();
        if (evt.preventDefault) evt.preventDefault();


        let { pos, active } = this;

        if (!pos) {
            this.pos = evt.screenX;
            return;
        }

        let delta = evt.screenX - pos;
        let index = this.children.indexOf(active);

        this.recalculateDimensions(index, delta);
        this.recalculateStyle();

        this.pos = evt.screenX;
    }

    mouseup() {
        this.pos = null;
        this.active = null;
    }

    mousedown(evt) {
        this.active = evt.target;
    }
}

class SpacerStyle {
    constructor({ width, paneCount, gripSize = 7 }) {
        this.storage =  new StateStorage("remit:layout");

        if (!this.dimensions)
            this._initialDimensions(width, paneCount, gripSize);
    }

    get dimensions() {
        if (!this._dimensions) {
            const stored = this.storage.get();
            // if (stored) this._dimensions = stored;
        }

        return this._dimensions;
    }

    set dimensions(dimensions) {
        this._dimensions = dimensions;
        this.storage.set(dimensions);
    }

    get style() {
        if (!this._style)
            this.calculateStyle();

        return this._style;
    }

    _initialDimensions(width, paneCount, gripWidth) {
        const style = [];

        let totalGripWidth = paneCount * gripWidth;
        let childWidth = (width - totalGripWidth) / paneCount;
        let left = 0;

        for (let i = 0; i < paneCount; i++) {
            style.push({
                left: left,
                width: childWidth
            });

            left = left + childWidth;

            if (i < (paneCount - 1)) {
                style.push({
                    left: left,
                    width: gripWidth
                });

                left = left + gripWidth;
            }
        }

        this.dimensions = style;
    }

    calculateStyle() {
        let style = this.dimensions.map((childStyle, index) => {
            if (index % 2 == 0) {
                return Object.assign(childStyle, {
                    top: 0,
                    zIndex: 1,
                    bottom: 0,
                    border: "none",
                    position: "absolute",
                    overflow: "auto"
                });
            }

            return Object.assign(childStyle, {
                zIndex: 10,
                backgroundColor: "#eee",
                cursor: "col-resize",
                position: "absolute",
                top: 0,
                bottom: 0
            });
        });
        
        this._style = style;
    }

}

class SpacerBody extends Component {
    componentWillReceiveProps(props) {
        const { width } = props;
        
        if (!width) return props;
        if (!(this.base && this.base.querySelectorAll)) return props;

        if (!(this.state.manager)) {
            let manager = new EventManager(this.base, this._style);
            manager.init();
            this.setState({ manager });
        }

        return props;
    }

    get style() {
        if (!this._style) {
            const { width, children } = this.props;
            this._style = new SpacerStyle({
                width,
                paneCount: children.length
            });
        }

        return this._style.style;
    }


    render({ width, children }) {
        if (!width) return null;
        const { style } = this;

        const parentStyle = {
            position: "relative",
            boxSizing: "border-box",
            height: "100%"
        };

        return (
            <div style={parentStyle}>
                {style.map((style, index) => {
                    let mod = index % 2;
                    

                    if (mod == 1) {
                        return (
            				<div class="grippy" style={style}/>
                        );
                    }
                    
                    let childIndex = index ? index / 2 : index;

                    return (
                        <div style={style}>
                            {children[childIndex]}
                        </div>
                    );
                })}
			</div>
        );
    }
}


export default class Spacer extends Component {
    componentDidMount() {
        this.setState({
            width: this.base.scrollWidth
        });
    }

    render({ children, style }) {

        let spacerParentStyle = Object.assign(style, {
            boxSizing: "border-box",
            overflow: "hidden"
        });

        return (
            <div style={spacerParentStyle}>
				<SpacerBody width={this.state.width} children={children} />
			</div>
        );
    }
}