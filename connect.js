import shallowEqual from './shallowEqual.js'
import warning from './warning.js'
import wrapActionCreators from './wrapActionCreators.js'
import { assign } from './utils/Object.js'
import cloneDeep from 'lodash.clonedeep'

const defaultMapStateToProps = state => ({}) // eslint-disable-line no-unused-vars
const defaultMapDispatchToProps = dispatch => ({ dispatch })

function connect(mapStateToProps, mapDispatchToProps) {
    const shouldSubscribe = Boolean(mapStateToProps)
    const mapState = mapStateToProps || defaultMapStateToProps
    const app = getApp();

    let mapDispatch
    if (typeof mapDispatchToProps === 'function') {
        mapDispatch = mapDispatchToProps
    } else if (!mapDispatchToProps) {
        mapDispatch = defaultMapDispatchToProps
    } else {
        mapDispatch = wrapActionCreators(mapDispatchToProps)
    }

    return function wrapWithConnect(pageConfig) {
        
        function handleChange(data) {
            if (!this.unsubscribe) {
                return
            }
            const state = this.store.getState()
            const mappedState = mapState(state, data);
            if (!this.data || shallowEqual(this.data, mappedState)) {
                // console.log(shallowEqual(this.data, mappedState))
                return;
            }
            this.setData(cloneDeep(mappedState))
            // console.log(this.data.tradeList)
        }

        const {
            onLoad: _onLoad,
            onUnload: _onUnload,
            didMount: _didMount,//组件
            didUnmount: _didUnmount//组件
        } = pageConfig
        const isComponent = (typeof _didMount === 'function');
        if(isComponent) {
        }
        function onLoad(options) {
            this.store = app.store;
            if (!this.store) {
                warning("Store对象不存在!")
            }
            if (shouldSubscribe) {
                this.unsubscribe = this.store.subscribe(handleChange.bind(this, this.data || {}));
                handleChange.call(this, this.data || {})
            }
            if (typeof _onLoad === 'function') {
                _onLoad.call(this, options)
            }
            if (typeof _didMount === 'function') {
                _didMount.call(this, options)
            }
        }

        function onUnload() {
            if (typeof _onUnload === 'function') {
                _onUnload.call(this)
            }
            if (typeof _didUnmount === 'function') {
                _didUnmount.call(this)
            }
            typeof this.unsubscribe === 'function' && this.unsubscribe()
        }
        if(isComponent) {
            pageConfig.methods = {...pageConfig.methods, ...mapDispatch(app.store.dispatch, app.store.getState())}
        }
        let config = assign({}, pageConfig, isComponent ? {} : mapDispatch(app.store.dispatch, app.store.getState()), isComponent ? {didMount: onLoad, didUnmount: onUnload} : { onLoad, onUnload })
        return config
    }
}

module.exports = connect