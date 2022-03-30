import React, { Component } from 'react'

export default class Game extends Component {
    constructor(props) {
        super(props)

        this.state = {
            userName: this.props.$stateParams.userName,
            gameId: this.props.$stateParams.gameId,
            game: null,
            gameHidden: false,
        }

        this.getGame = this.getGame.bind(this)
        this.toggleHidden = this.toggleHidden.bind(this)
    }
    componentDidMount() {
        this.getGame()
    }

    getGame() {
        this.props.api.getGame(this.state.gameId, this.state.userName).then((result) => {
            this.setState({
                game: result.game,
                gameHidden: result.game.metadata.isHidden,
            })
        })
    }

    toggleHidden() {
        this.props.api.toggleGameHidden(this.state.gameId, this.state.userName).then((result) => {
            this.setState({
                gameHidden: result.gameHidden,
            })
        })
    }

    render() {
        if (!this.state.game) {
            return <div>Game loading...</div>
        }
        return (
            <div>
                <h2>{this.state.game.name}</h2>
                <button onClick={this.toggleHidden}>{this.state.gameHidden ? 'Show Game' : 'Hide Game'}</button>
            </div>
        )
    }
}
