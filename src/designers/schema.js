// @flow
import React from 'react';
import {ButtonGroup, Button, Tab, Tabs} from '@blueprintjs/core';
import {autoBindMethodsForReact} from 'class-autobind-decorator';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {isEqual} from 'lodash';
import {defaultSchema} from '../utils';
import {schemaSlice, generateExampleFromSchema} from '../redux/modules/schema';
import {dropdownSlice} from '../redux/modules/dropdown';
import SchemaRow from '../elements/schema-row';
import SchemaJson from '../elements/schema-json';
import DebouncedInput from '../elements/debounced-input';
import JsonEditor from '../editors/json-editor';

@autoBindMethodsForReact()
class SchemaDesigner extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      validGeneratedJson: false,
      generateCode: false,
      userCode: '{}',
      selectedTab: 'schema',
    };
  }

  componentDidUpdate(oldProps) {
    if (
      typeof this.props.onChange === 'function' &&
      this.props.schema !== oldProps.schema
    ) {
      const newData = this.props.schema || '';
      const oldData = oldProps.schema || '';
      if (!isEqual(oldData, newData)) return this.props.onChange(newData);
    }
    if (this.props.initschema !== oldProps.initschema) {
      this.props.changeEditorSchema({
        value: this.props.initschema || defaultSchema.object,
      });
    }
  }

  componentDidMount() {
    const {initschema} = this.props;
    //@TODO Add schema validation
    if (initschema) this.props.changeEditorSchema({value: initschema});
  }

  addChildField() {
    this.props.addChildField({key: ['properties']});
    this.props.setOpenDropdownPath({key: ['properties'], value: true});
  }

  _toggleGenerateFromCode(desiredState = false) {
    this.setState({generateCode: desiredState});
  }

  _handleGenerateFromCode() {
    const {generateSchema} = this.props;
    const {userCode} = this.state;
    try {
      generateSchema(userCode);
      this.setState({userCode: '{}', generateCode: false});
    } catch (error) {
      console.error(error);
    }
  }

  _setUserCode(userCode) {
    try {
      JSON.parse(userCode);
      this.setState({validGeneratedJson: true});
    } catch (error) {
      this.setState({validGeneratedJson: false});
    }
    this.setState({userCode});
  }

  addExample(key, value) {
    const {generateExampleFromSchema} = this.props;
    generateExampleFromSchema({key, value});
  }

  _deleteExample(title) {
    const {deleteExample} = this.props;
    deleteExample(title);
    this.setState({selectedTab: 'schema'});
  }

  _handleChangeExampleTitle(oldTitle, newTitle) {
    const {renameExample} = this.props;
    renameExample({oldTitle, newTitle});
    this.setState({selectedTab: newTitle});
  }

  _handleDescription({value}) {
    const {schema, changeValue} = this.props;
    changeValue({
      key: [],
      value: {...schema, ...{description: value}},
    });
  }

  renderForm() {
    const {schema, open} = this.props;
    return (
      <>
        <Button icon="clean" onClick={() => this._toggleGenerateFromCode(true)}>
          Generate from JSON
        </Button>
        <SchemaRow
          show
          root
          sidebar={open}
          schema={schema}
          handleField={this.addChildField}
          handleSidebar={this.props.setOpenDropdownPath}
          handleSchemaType={this.props.changeType}
          handleTitle={this.props.changeValue}
          handleDescription={this._handleDescription}
          handleAdditionalProperties={this.props.changeValue}
        />
        {!!open.properties.show && (
          <SchemaJson wrapperProps={{...this.props}} />
        )}
      </>
    );
  }

  renderGenerateCode() {
    const {userCode, validGeneratedJson} = this.state;
    return (
      <>
        <ButtonGroup>
          <Button
            icon="clean"
            disabled={!validGeneratedJson}
            onClick={this._handleGenerateFromCode}>
            Generate
          </Button>
          <Button
            icon="small-cross"
            onClick={() => this._toggleGenerateFromCode(false)}>
            Cancel
          </Button>
        </ButtonGroup>
        <div>
          <JsonEditor value={userCode} onChange={this._setUserCode} />
        </div>
      </>
    );
  }

  renderSchema() {
    const {generateCode} = this.state;
    return generateCode === true
      ? this.renderGenerateCode()
      : this.renderForm();
  }

  renderExample(title, content) {
    return (
      <div>
        <div className="flex p-1">
          <DebouncedInput
            className="pl-1 flex-1"
            onChange={() => {}}
            onBlur={(e) => this._handleChangeExampleTitle(title, e)}
            value={title}
          />
          <Button
            className="ml-3"
            onClick={() => this._deleteExample(title)}
            icon="trash"
          />
        </div>
        <JsonEditor value={content} onBlur={(e) => this.addExample(title, e)} />
      </div>
    );
  }

  handleTabChange(selectedTab) {
    this.setState({selectedTab});
  }

  render() {
    const {schema, dark} = this.props;
    const {selectedTab} = this.state;
    return (
      <div className={`json-schema-react-editor ${dark && 'bp3-dark'}`}>
        <Tabs
          className="bp3-simple-tab-list"
          id="SchemTabs"
          key={'horizontal'}
          onChange={this.handleTabChange}
          selectedTabId={selectedTab}>
          <Tab
            className="bp3-simple-tab"
            id="schema"
            title="Schema"
            panel={this.renderSchema()}
          />
          {schema.examples &&
            Object.keys(schema.examples).map((example, i) => (
              <Tab
                className="bp3-simple-tab"
                id={example}
                key={i}
                title={example}
                panel={this.renderExample(example, schema.examples[example])}
              />
            ))}
          <Button icon="small-plus" onClick={() => this.addExample()}>
            Example
          </Button>
        </Tabs>
      </div>
    );
  }
}

SchemaDesigner.propTypes = {
  initschema: PropTypes.object,
  schema: PropTypes.object,
  open: PropTypes.object,
  dark: PropTypes.bool,
  onChange: PropTypes.func,
  changeEditorSchema: PropTypes.func,
  changeName: PropTypes.func,
  changeValue: PropTypes.func,
  changeType: PropTypes.func,
  enableRequire: PropTypes.func,
  deleteItem: PropTypes.func,
  addField: PropTypes.func,
  addChildField: PropTypes.func,
  addExample: PropTypes.func,
  deleteExample: PropTypes.func,
  setOpenDropdownPath: PropTypes.func,
  generateExampleFromSchema: PropTypes.func,
  renameExample: PropTypes.func,
  generateSchema: PropTypes.func,
};

const mapStateToProps = ({schema, dropdown}) => {
  return {schema, open: dropdown};
};

const mapDispatchToProps = (dispatch) => {
  const schema = bindActionCreators(
    {...schemaSlice.actions, generateExampleFromSchema},
    dispatch,
  );
  const dropdown = bindActionCreators(dropdownSlice.actions, dispatch);
  return {
    changeEditorSchema: schema.changeEditorSchema,
    changeName: schema.changeName,
    changeValue: schema.changeValue,
    changeType: schema.changeType,
    enableRequire: schema.enableRequire,
    deleteItem: schema.deleteItem,
    addField: schema.addField,
    addChildField: schema.addChildField,
    addExample: schema.addExample,
    deleteExample: schema.deleteExample,
    setOpenDropdownPath: dropdown.setOpenDropdownPath,
    generateExampleFromSchema: schema.generateExampleFromSchema,
    renameExample: schema.renameExample,
    generateSchema: schema.generateSchema,
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SchemaDesigner);
