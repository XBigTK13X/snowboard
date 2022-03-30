import React, { Component } from 'react'

import Comp from '../comp'

export default class Collection extends Component {
    constructor(props) {
        super(props)

        this.state = {
            userName: this.props.$stateParams.userName,
            collection: null,
        }

        this.getCollection = this.getCollection.bind(this)
    }
    componentDidMount() {
        this.getCollection()
    }
    getCollection() {
        this.props.api.getCollection(this.state.userName).then((result) => {
            this.setState({
                collection: result.collection,
            })
        })
    }
    render() {
        if (!this.state.collection) {
            return <div>Collecting loading...</div>
        }
        return (
            <div>
                {this.state.collection.map((game) => {
                    return (
                        <div className="game-thumbnail" key={game.bgg.thingId}>
                            <Comp.Href to="game" params={{ userName: this.state.userName, gameId: game.bgg.thingId }}>
                                <img className="game-thumbnail" src={game.thumbnailUrl} alt="thumbnail" />
                            </Comp.Href>
                            <div className="game-title">
                                <p>{game.name}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }
}
