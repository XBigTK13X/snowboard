import React, { Component } from 'react'

import Comp from './'

const actionLinks = [
    {
        text: 'Admin',
        to: 'admin',
    },
]

export default class NavBar extends Component {
    render() {
        return (
            <div>
                {actionLinks.map((link, linkIndex) => {
                    return <Comp.LinkTile key={linkIndex} to={link.to} text={link.text} params={link.params} />
                })}
            </div>
        )
    }
}
