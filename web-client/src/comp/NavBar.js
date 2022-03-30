import React, { Component } from 'react'

import Comp from './'

const actionLinks = [
    {
        text: 'Admin',
        to: 'admin',
    },
    {
        text: 'Collection',
        to: 'collection',
    },
]

export default class NavBar extends Component {
    render() {
        return (
            <div>
                {actionLinks.map((link, linkIndex) => {
                    //TODO Fix this by using state params or something
                    let params = { userName: 'xbigtk13x' }
                    return <Comp.LinkTile key={linkIndex} to={link.to} text={link.text} params={params} />
                })}
            </div>
        )
    }
}
