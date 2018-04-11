import React, { Component } from 'react';
export default class Plans extends Component {
    render() {
        return (React.createElement("table", null,
            React.createElement("thead", null,
                React.createElement("tr", null,
                    React.createElement("th", null, "Name"),
                    React.createElement("th", null, "Score"))),
            React.createElement("tbody", null,
                React.createElement("tr", null,
                    React.createElement("td", null, "Ryu"),
                    React.createElement("td", null, "10000")),
                React.createElement("tr", { className: "is-selected" },
                    React.createElement("td", null, "Ken"),
                    React.createElement("td", null, "5000")),
                React.createElement("tr", null,
                    React.createElement("td", null, "Akuma"),
                    React.createElement("td", null, "1200")))));
    }
}
//# sourceMappingURL=Plans.js.map