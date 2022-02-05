import React, { Component } from 'react'
import { UIRouter, UIView, pushStateLocationPlugin } from '@uirouter/react'
import routes from './routes'
import Comp from './comp'
const snowboardApi = require('./snowboard-api-client').default

const plugins = [pushStateLocationPlugin]

const configRouter = (router) => {
    router.urlRouter.otherwise('/')
}

export default class App extends Component {
    constructor(props) {
        super(props)

        this.state = {
            api: snowboardApi,
        }
    }

    componentDidMount() {}

    render() {
        return (
            <div>
                <UIRouter plugins={plugins} states={routes} config={configRouter}>
                    <div className="page-wrapper">
                        <Comp.NavBar />
                        <br />
                        <UIView
                            render={(Component, props) => {
                                return <Component api={this.state.api} {...props} />
                            }}
                        />
                    </div>
                </UIRouter>
            </div>
        )
    }
}
