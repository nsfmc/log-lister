import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import get from 'lodash/get';

class App extends Component {
  constructor(props) {
    super(props);

    this.handleDragOver = this._handleDragOver.bind(this);
    this.handleDrop = this._handleDrop.bind(this);
    this.handleClear = this._handleClear.bind(this);

    this.state = {
      dropFileNames: [],
      droppedFiles: {},
      dragging: false,
    };
  }

  componentDidMount() {
    window.addEventListener('dragover', this.handleDragOver);
    window.addEventListener('drop', this.handleDrop);
  }

  componentWillUnmount() {
    window.removeEventListener('dragover', this.handleDragOver);
    window.removeEventListener('drop', this.handleDrop);
  }

  render() {
    return (
      <div className="App">
        <button onClick={this.handleClear}>clear files</button>
        {this.state.dropFileNames.length > 0 &&
          this.state.dropFileNames.map(({name: filename}) => (
            <DropFileDesc
              key={filename}
              filename={filename}
              data={this.state.droppedFiles[filename]}
            />
          ))}
      </div>
    );
  }

  _handleClear() {
    this.setState({
      dropFileNames: [],
      droppedFiles: {},
    });
  }

  _handleDragOver(e) {
    e.preventDefault();

    this.setState({dragging: true});
  }

  _handleDrop(e) {
    e.preventDefault();
    console.log(e.dataTransfer.types);
    const dropFileNames = [];

    for (let i = 0; i < e.dataTransfer.files.length; i += 1) {
      let curr = e.dataTransfer.files[i];
      if (['application/json'].includes(curr.type)) {
        const reader = new FileReader();
        reader.onload = event => {
          this.setState({
            droppedFiles: {
              ...this.state.droppedFiles,
              [curr.name]: JSON.parse(event.target.result),
            },
          });
        };
        reader.readAsText(curr);
      }
      dropFileNames.push({name: curr.name, type: curr.type});
    }
    this.setState({dropFileNames, dragging: false});

    if (e.dataTransfer.items) {
      // Use DataTransferItemList interface to remove the drag data
      e.dataTransfer.items.clear();
    } else {
      // Use DataTransfer interface to remove the drag data
      e.dataTransfer.clearData();
    }
  }
}

class DropFileDesc extends Component {
  render() {
    return (
      <div>
        <p>{this.props.filename}</p>
        {this.isLogglyish(this.props.data) && (
          <LogglyRender data={this.props.data} />
        )}
      </div>
    );
  }
  isLogglyish(data) {
    return (
      typeof data === 'object' &&
      data.hasOwnProperty('total_events') &&
      data.hasOwnProperty('page') &&
      data.hasOwnProperty('events')
    );
  }
}

class LogglyRender extends Component {
  state = {
    sort: 'timestamp',
    sortDir: 'asc',
  };

  render() {
    const {events} = this.props.data;

    return (
      <div>
        {events.sort((a,b) => {
          const delta = get(a, this.state.sort, 0) - get(b, this.state.sort, 0);
          return this.state.sortDir === 'asc' ? delta : (-1 * delta);
        }).filter(row => row.logtypes.includes('json')).map(row => <LogRow key={row.id} row={row} />)}
      </div>
    );
  }
}

class LogRow extends Component {
  render() {
    const {row} = this.props;
    return (
      <div title={row.id} style={{marginBottom: '40px'}}>

        <p><strong>{row.event.nginx && row.event.nginx.status}</strong> {row.logtypes.join(', ')} </p>
        <div style={{marginLeft: 20, whiteSpace: 'wrap'}}>
          <p>{get(row, 'event.json.message')}</p>
          <p>{get(row, 'logmsg')}</p>
        </div>
      </div>
    );
  }
}

export default App;
