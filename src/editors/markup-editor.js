// @flow
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';

class MarkupEditor extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {value: '', error: null};
  }

  componentDidMount() {
    const {value} = this.props;
    this.setState({value});
  }

  componentDidUpdate(oldProps) {
    const {value} = this.props;
    if (oldProps.value != value) {
      this.setState({value});
    }
  }

  _handleChange(e) {
    this.setState({value: e});
    this.props.onChange(e);
  }

  _handleBlur() {
    const {value} = this.state;
    if (value && typeof this.props.onBlur === 'function') {
      this.props.onBlur(value);
    }
  }

  render() {
    const {value, error} = this.state;
    return (
      <>
        <Editor
          textareaClassName="bp3-code bp3-input bp3-fill reactopenapidesigner__simple__editor"
          preClassName=""
          value={value}
          highlight={(code) =>
            code && Prism.highlight(code, Prism.languages.markup, 'markup')
          }
          onValueChange={(e) => this._handleChange(e)}
          onBlur={(e) => this._handleBlur(e.target.value)}
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 12,
            width: '100%',
          }}
        />
        {error && <div className="text-sm text-red-400">{error}</div>}
      </>
    );
  }
}

MarkupEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onValidJson: PropTypes.func,
  onInValidJson: PropTypes.func,
  onBlur: PropTypes.func,
};

export default MarkupEditor;
