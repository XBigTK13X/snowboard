import React, { Component } from 'react'

export default class Admin extends Component {
    constructor(props) {
        super(props)

        this.state = {
            userName: this.props.$stateParams.userName,
        }

        this.updateCollection = this.updateCollection.bind(this)
        this.updatePlays = this.updatePlays.bind(this)
        this.updateGameDetails = this.updateGameDetails.bind(this)
        this.ingestGames = this.ingestGames.bind(this)
        this.ingestPlays = this.ingestPlays.bind(this)
    }
    updateCollection() {
        this.props.api.updateCollection(this.state.userName)
    }
    updatePlays() {
        this.props.api.updatePlays(this.state.userName)
    }
    updateGameDetails() {
        this.props.api.updateGameDetails(this.state.userName)
    }
    ingestGames() {
        this.props.api.ingestGames(this.state.userName)
    }
    ingestPlays() {
        this.props.api.ingestPlays(this.state.userName)
    }
    render() {
        return (
            <div>
                <p>Welcome to Snowboard!</p>
                <br />
                <h3>Board Game Geek - Cache Generation</h3>
                <button onClick={this.updateCollection}>Update Collection</button>
                <br />
                <button onClick={this.updatePlays}>Update Plays</button>
                <br />
                <button onClick={this.updateGameDetails}>Update Game Details</button>
                <br />
                <h3>Snowboard - Board Game Geek Data Transform</h3>
                <button onClick={this.ingestGames}>Ingest Games</button>
                <br />
                <button onClick={this.ingestPlays}>Ingest Plays</button>
            </div>
        )
    }
}
