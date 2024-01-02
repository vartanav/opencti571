import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import * as R from 'ramda';
import SpriteText from 'three-spritetext';
import { debounce } from 'rxjs/operators';
import { Subject, timer } from 'rxjs';
import { graphql, createFragmentContainer } from 'react-relay';
import ForceGraph2D from 'react-force-graph-2d';
import ForceGraph3D from 'react-force-graph-3d';
import withTheme from '@mui/styles/withTheme';
import { withRouter } from 'react-router-dom';
import RectangleSelection from 'react-rectangle-selection';
import { Chart } from 'regraph';
import inject18n from '../../../../components/i18n';
import {
  commitMutation,
  fetchQuery,
  MESSAGING$,
} from '../../../../relay/environment';
import {
  applyFilters,
  buildGraphData,
  computeTimeRangeInterval,
  computeTimeRangeValues,
  decodeGraphData,
  encodeGraphData, groupSelectedNodes,
  reGraphData,
} from '../../../../utils/Graph';
import {
  buildViewParamsFromUrlAndStorage,
  saveViewParameters,
} from '../../../../utils/ListParameters';
import ReportKnowledgeGraphBar from './ReportKnowledgeGraphBar';
import { reportMutationFieldPatch } from './ReportEditionOverview';
import {
  reportKnowledgeGraphtMutationRelationAddMutation,
  reportKnowledgeGraphMutationRelationDeleteMutation,
  reportKnowledgeGraphQueryStixRelationshipDeleteMutation,
  reportKnowledgeGraphQueryStixObjectDeleteMutation,
} from './ReportKnowledgeGraphQuery';
import ContainerHeader from '../../common/containers/ContainerHeader';
import ReportPopover from './ReportPopover';
import EntitiesDetailsRightsBar from '../../../../utils/graph/EntitiesDetailsRightBar';
import {Regraph} from "./Regraph";

const ignoredStixCoreObjectsTypes = ['Report', 'Note', 'Opinion'];

const PARAMETERS$ = new Subject().pipe(debounce(() => timer(2000)));
const POSITIONS$ = new Subject().pipe(debounce(() => timer(2000)));

export const reportKnowledgeGraphQuery = graphql`
    query ReportKnowledgeGraphQuery($id: String) {
        report(id: $id) {
            ...ReportKnowledgeGraph_report
        }
    }
`;

const reportKnowledgeGraphCheckObjectQuery = graphql`
    query ReportKnowledgeGraphCheckObjectQuery($id: String!) {
        stixObjectOrStixRelationship(id: $id) {
            ... on BasicObject {
                id
            }
            ... on StixCoreObject {
                is_inferred
                parent_types
                reports {
                    edges {
                        node {
                            id
                        }
                    }
                }
            }
            ... on BasicRelationship {
                id
            }
            ... on StixCoreRelationship {
                is_inferred
                parent_types
                reports {
                    edges {
                        node {
                            id
                        }
                    }
                }
            }
            ... on StixRefRelationship {
                is_inferred
                parent_types
                reports {
                    edges {
                        node {
                            id
                        }
                    }
                }
            }
            ... on StixSightingRelationship {
                is_inferred
                parent_types
                reports {
                    edges {
                        node {
                            id
                        }
                    }
                }
            }
        }
    }
`;

const reportKnowledgeGraphStixCoreObjectQuery = graphql`
    query ReportKnowledgeGraphStixCoreObjectQuery($id: String!) {
        stixCoreObject(id: $id) {
            id
            entity_type
            parent_types
            created_at
            createdBy {
                ... on Identity {
                    id
                    name
                    entity_type
                }
            }
            objectMarking {
                edges {
                    node {
                        id
                        definition_type
                        definition
                        x_opencti_order
                        x_opencti_color
                    }
                }
            }
            ... on StixDomainObject {
                created
            }
            ... on AttackPattern {
                name
                x_mitre_id
            }
            ... on Campaign {
                name
                first_seen
                last_seen
            }
            ... on CourseOfAction {
                name
            }
            ... on Note {
                attribute_abstract
                content
            }
            ... on ObservedData {
                name
                first_observed
                last_observed
            }
            ... on Opinion {
                opinion
            }
            ... on Report {
                name
                published
            }
            ... on Grouping {
                name
                description
            }
            ... on Individual {
                name
            }
            ... on Organization {
                name
            }
            ... on Sector {
                name
            }
            ... on System {
                name
            }
            ... on Indicator {
                name
                valid_from
            }
            ... on Infrastructure {
                name
            }
            ... on IntrusionSet {
                name
                first_seen
                last_seen
            }
            ... on Position {
                name
            }
            ... on City {
                name
            }
            ... on AdministrativeArea {
                name
            }
            ... on Country {
                name
            }
            ... on Region {
                name
            }
            ... on Malware {
                name
                first_seen
                last_seen
            }
            ... on ThreatActor {
                name
                first_seen
                last_seen
            }
            ... on Tool {
                name
            }
            ... on Vulnerability {
                name
            }
            ... on Incident {
                name
                first_seen
                last_seen
            }
            ... on StixCyberObservable {
                observable_value
            }
            ... on StixFile {
                observableName: name
            }
            ... on Event {
                name
            }
            ... on Case {
                name
            }
            ... on Narrative {
                name
            }
            ... on DataComponent {
                name
            }
            ... on DataSource {
                name
            }
            ... on Language {
                name
            }
        }
    }
`;

const reportKnowledgeGraphStixRelationshipQuery = graphql`
    query ReportKnowledgeGraphStixRelationshipQuery($id: String!) {
        stixRelationship(id: $id) {
            id
            entity_type
            parent_types
            ... on StixCoreRelationship {
                relationship_type
                start_time
                stop_time
                confidence
                created
                is_inferred
                from {
                    ... on BasicObject {
                        id
                        entity_type
                        parent_types
                    }
                    ... on BasicRelationship {
                        id
                        entity_type
                        parent_types
                    }
                    ... on StixCoreRelationship {
                        relationship_type
                    }
                }
                to {
                    ... on BasicObject {
                        id
                        entity_type
                        parent_types
                    }
                    ... on BasicRelationship {
                        id
                        entity_type
                        parent_types
                    }
                    ... on StixCoreRelationship {
                        relationship_type
                    }
                }
                created_at
                createdBy {
                    ... on Identity {
                        id
                        name
                        entity_type
                    }
                }
                objectMarking {
                    edges {
                        node {
                            id
                            definition_type
                            definition
                            x_opencti_order
                            x_opencti_color
                        }
                    }
                }
            }
            ... on StixRefRelationship {
                relationship_type
                start_time
                stop_time
                confidence
                is_inferred
                from {
                    ... on BasicObject {
                        id
                        entity_type
                        parent_types
                    }
                    ... on BasicRelationship {
                        id
                        entity_type
                        parent_types
                    }
                    ... on StixCoreRelationship {
                        relationship_type
                    }
                }
                to {
                    ... on BasicObject {
                        id
                        entity_type
                        parent_types
                    }
                    ... on BasicRelationship {
                        id
                        entity_type
                        parent_types
                    }
                    ... on StixCoreRelationship {
                        relationship_type
                    }
                }
                created_at
                datable
                objectMarking {
                    edges {
                        node {
                            id
                            definition_type
                            definition
                            x_opencti_order
                            x_opencti_color
                        }
                    }
                }
            }
            ... on StixSightingRelationship {
                relationship_type
                first_seen
                last_seen
                confidence
                created
                is_inferred
                from {
                    ... on BasicObject {
                        id
                        entity_type
                        parent_types
                    }
                    ... on BasicRelationship {
                        id
                        entity_type
                        parent_types
                    }
                    ... on StixCoreRelationship {
                        relationship_type
                    }
                }
                to {
                    ... on BasicObject {
                        id
                        entity_type
                        parent_types
                    }
                    ... on BasicRelationship {
                        id
                        entity_type
                        parent_types
                    }
                    ... on StixCoreRelationship {
                        relationship_type
                    }
                }
                created_at
                createdBy {
                    ... on Identity {
                        id
                        name
                        entity_type
                    }
                }
                objectMarking {
                    edges {
                        node {
                            id
                            definition_type
                            definition
                            x_opencti_order
                            x_opencti_color
                        }
                    }
                }
            }
        }
    }
`;

class ReportKnowledgeGraphComponent extends Component {
  constructor(props) {
    super(props);
    this.initialized = false;
    this.zoomed = 0;
    this.graph = React.createRef();
    this.refForRegraph = React.createRef();
    this.selectedNodes = new Set();
    this.selectedLinks = new Set();
    this.comboLookup = React.createRef({});
    this.nextComboId = React.createRef(0);
    const params = buildViewParamsFromUrlAndStorage(
      props.history,
      props.location,
      `view-report-${this.props.report.id}-knowledge`,
    );
    this.zoom = R.propOr(null, 'zoom', params);
    this.graphObjects = props.report.objects.edges.map((n) => ({
      ...n.node,
      types: n.types,
    }));
    this.graphData = buildGraphData(
      this.graphObjects,
      decodeGraphData(props.report.x_opencti_graph_data),
      props.t,
    );
    const sortByLabel = R.sortBy(R.compose(R.toLower, R.prop('tlabel')));
    const sortByDefinition = R.sortBy(
      R.compose(R.toLower, R.prop('definition')),
    );
    const sortByName = R.sortBy(R.compose(R.toLower, R.prop('name')));
    const allStixCoreObjectsTypes = R.pipe(
      R.map((n) => R.assoc(
        'tlabel',
        props.t(
          `${n.relationship_type ? 'relationship_' : 'entity_'}${
            n.entity_type
          }`,
        ),
        n,
      )),
      sortByLabel,
      R.map((n) => n.entity_type),
      R.uniq,
    )(this.graphData.nodes);
    const nodesAndLinks = [...this.graphData.nodes, ...this.graphData.links];
    const allMarkedBy = R.pipe(
      R.map((n) => n.markedBy),
      R.flatten,
      R.uniqBy(R.prop('id')),
      sortByDefinition,
    )(nodesAndLinks);
    const allCreatedBy = R.pipe(
      R.map((n) => n.createdBy),
      R.uniqBy(R.prop('id')),
      sortByName,
    )(nodesAndLinks);
    const stixCoreObjectsTypes = R.propOr(
      allStixCoreObjectsTypes,
      'stixCoreObjectsTypes',
      params,
    );
    const markedBy = R.propOr(
      allMarkedBy.map((n) => n.id),
      'markedBy',
      params,
    );
    const createdBy = R.propOr(
      allCreatedBy.map((n) => n.id),
      'createdBy',
      params,
    );
    const graphWithFilters = applyFilters(
      this.graphData,
      stixCoreObjectsTypes,
      markedBy,
      createdBy,
      ignoredStixCoreObjectsTypes,
    );

    const timeRangeInterval = computeTimeRangeInterval(this.graphObjects);
    this.state = {
      mode3D: R.propOr(false, 'mode3D', params),
      selectModeFree: R.propOr(false, 'selectModeFree', params),
      modeFixed: R.propOr(false, 'modeFixed', params),
      modeTree: R.propOr('', 'modeTree', params),
      displayTimeRange: R.propOr(false, 'displayTimeRange', params),
      rectSelected: {
        origin: [0, 0],
        target: [0, 0],
        shiftKey: false,
        altKey: false,
      },
      selectedTimeRangeInterval: timeRangeInterval,
      allStixCoreObjectsTypes,
      allMarkedBy,
      allCreatedBy,
      stixCoreObjectsTypes,
      markedBy,
      createdBy,
      graphData: graphWithFilters,
      numberOfSelectedNodes: 0,
      numberOfSelectedLinks: 0,
      openCombos: {},
      width: null,
      height: null,
      zoomed: false,
      keyword: '',
      navOpen: localStorage.getItem('navOpen') === 'true',
    };
  }

  initialize() {
    if (this.initialized) return;
    if (this.graph && this.graph.current) {
      this.graph.current.d3Force('link').distance(50);
      if (this.state.modeTree !== '') {
        this.graph.current.d3Force('charge').strength(-1000);
      }
      if (this.zoomed < 2) {
        if (this.zoom && this.zoom.k && !this.state.mode3D) {
          this.graph.current.zoom(this.zoom.k, 400);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const currentContext = this;
          setTimeout(
            () => currentContext.graph
                            && currentContext.graph.current
                            && currentContext.graph.current.zoomToFit(0, 150),
            1200,
          );
        }
      }
      this.initialized = true;
      this.zoomed += 1;
    }
  }

  componentDidMount() {
    this.subscription1 = PARAMETERS$.subscribe({
      next: () => this.saveParameters(),
    });
    this.subscription2 = POSITIONS$.subscribe({
      next: () => this.savePositions(),
    });
    this.subscription3 = MESSAGING$.toggleNav.subscribe({
      next: () => this.setState({ navOpen: localStorage.getItem('navOpen') === 'true' }),
    });
    this.initialize();
  }

  componentWillUnmount() {
    this.subscription1.unsubscribe();
    this.subscription2.unsubscribe();
    this.subscription3.unsubscribe();
  }

  saveParameters(refreshGraphData = false) {
    saveViewParameters(
      this.props.history,
      this.props.location,
      `view-report-${this.props.report.id}-knowledge`,
      { zoom: this.zoom, ...this.state },
    );
    if (refreshGraphData) {
      this.setState({
        graphData: applyFilters(
          this.graphData,
          this.state.stixCoreObjectsTypes,
          this.state.markedBy,
          this.state.createdBy,
          ignoredStixCoreObjectsTypes,
        ),
      });
    }
  }

  saveGrouping(nodes) {
    commitMutation({
      mutation: reportMutationFieldPatch,
      variables: {
        id: this.props.report.id,
        input: {
          key: 'x_opencti_graph_data',
          value: encodeGraphData(nodes.reduce((acc, n) => {
            acc[n.id] = {
              id: n.id,
              x: n.x,
              y: n.y,
              ...(n.group ? { group: n.group } : {}),
            };
            return acc;
          }, {})),
        },
      },
    });
  }

  saveRePositions(positions) {
    commitMutation({
      mutation: reportMutationFieldPatch,
      variables: {
        id: this.props.report.id,
        input: {
          key: 'x_opencti_graph_data',
          value: encodeGraphData(positions),
        },
      },
    });
  }

  savePositions() {
    const initialPositions = R.indexBy(
      R.prop('id'),
      R.map((n) => ({ id: n.id, x: n.fx, y: n.fy }), this.graphData.nodes),
    );
    const newPositions = R.indexBy(
      R.prop('id'),
      R.map((n) => ({ id: n.id, x: n.fx, y: n.fy }), this.state.graphData.nodes),
    );

    const positions = R.mergeLeft(newPositions, initialPositions);
    commitMutation({
      mutation: reportMutationFieldPatch,
      variables: {
        id: this.props.report.id,
        input: {
          key: 'x_opencti_graph_data',
          value: encodeGraphData(positions),
        },
      },
    });
  }

  handleToggle3DMode() {
    this.setState({ mode3D: !this.state.mode3D }, () => this.saveParameters());
  }

  handleToggleSelectModeFree() {
    this.setState({ selectModeFree: !this.state.selectModeFree }, () => this.saveParameters());
  }

  handleToggleTreeMode(modeTree) {
    if (modeTree === 'horizontal') {
      this.setState(
        {
          modeTree: this.state.modeTree === 'horizontal' ? '' : 'horizontal',
        },
        () => {
          if (this.state.modeTree === 'horizontal') {
            this.graph.current.d3Force('charge').strength(-1000);
          } else {
            this.graph.current.d3Force('charge').strength(-30);
          }
          this.saveParameters();
        },
      );
    } else if (modeTree === 'vertical') {
      this.setState(
        {
          modeTree: this.state.modeTree === 'vertical' ? '' : 'vertical',
        },
        () => {
          if (this.state.modeTree === 'vertical') {
            this.graph.current.d3Force('charge').strength(-1000);
          } else {
            this.graph.current.d3Force('charge').strength(-30);
          }
          this.saveParameters();
        },
      );
    }
  }

  handleToggleFixedMode() {
    this.setState({ modeFixed: !this.state.modeFixed }, () => {
      this.saveParameters();
      this.handleDragEnd();
      this.forceUpdate();
      this.graph.current.d3ReheatSimulation();
    });
  }

  handleToggleDisplayTimeRange() {
    this.setState({ displayTimeRange: !this.state.displayTimeRange }, () => this.saveParameters());
  }

  handleToggleStixCoreObjectType(type) {
    const { stixCoreObjectsTypes } = this.state;
    if (stixCoreObjectsTypes.includes(type)) {
      this.setState(
        {
          stixCoreObjectsTypes: R.filter(
            (t) => t !== type,
            stixCoreObjectsTypes,
          ),
        },
        () => this.saveParameters(true),
      );
    } else {
      this.setState(
        { stixCoreObjectsTypes: R.append(type, stixCoreObjectsTypes) },
        () => this.saveParameters(true),
      );
    }
  }

  handleToggleMarkedBy(markingDefinition) {
    const { markedBy } = this.state;
    if (markedBy.includes(markingDefinition)) {
      this.setState(
        {
          markedBy: R.filter((t) => t !== markingDefinition, markedBy),
        },
        () => this.saveParameters(true),
      );
    } else {
      // eslint-disable-next-line max-len
      this.setState({ markedBy: R.append(markingDefinition, markedBy) }, () => this.saveParameters(true));
    }
  }

  handleToggleCreateBy(createdByRef) {
    const { createdBy } = this.state;
    if (createdBy.includes(createdByRef)) {
      this.setState(
        {
          createdBy: R.filter((t) => t !== createdByRef, createdBy),
        },
        () => this.saveParameters(true),
      );
    } else {
      // eslint-disable-next-line max-len
      this.setState({ createdBy: R.append(createdByRef, createdBy) }, () => this.saveParameters(true));
    }
  }

  resetAllFilters() {
    return new Promise((resolve) => {
      const sortByLabel = R.sortBy(R.compose(R.toLower, R.prop('tlabel')));
      const sortByDefinition = R.sortBy(
        R.compose(R.toLower, R.prop('definition')),
      );
      const sortByName = R.sortBy(R.compose(R.toLower, R.prop('name')));
      const allStixCoreObjectsTypes = R.pipe(
        R.map((n) => n.entity_type),
        R.uniq,
        R.map((n) => ({
          label: n,
          tlabel: this.props.t(
            `${n.relationship_type ? 'relationship_' : 'entity_'}${
              n.entity_type
            }`,
          ),
        })),
        sortByLabel,
        R.map((n) => n.label),
      )(this.graphData.nodes);
      const allMarkedBy = R.pipe(
        R.map((n) => n.markedBy),
        R.flatten,
        R.uniqBy(R.prop('id')),
        sortByDefinition,
      )(R.union(this.graphData.nodes, this.graphData.links));
      const allCreatedBy = R.pipe(
        R.map((n) => n.createdBy),
        R.uniqBy(R.prop('id')),
        sortByName,
      )(R.union(this.graphData.nodes, this.graphData.links));
      this.setState(
        {
          allStixCoreObjectsTypes,
          allMarkedBy,
          allCreatedBy,
          stixCoreObjectsTypes: allStixCoreObjectsTypes,
          markedBy: allMarkedBy.map((n) => n.id),
          createdBy: allCreatedBy.map((n) => n.id),
          keyword: '',
        },
        () => {
          this.saveParameters(false);
          resolve(true);
        },
      );
    });
  }

  handleZoomToFit(adjust = false) {
    if (adjust) {
      const container = document.getElementById('container');
      const { offsetWidth, offsetHeight } = container;
      this.setState({ width: offsetWidth, height: offsetHeight }, () => {
        this.graph.current.zoomToFit(400, 150);
      });
    } else {
      this.graph.current.zoomToFit(400, 150);
    }
  }

  onZoom() {
    this.zoomed += 1;
  }

  handleZoomEnd(zoom) {
    if (
      this.initialized
            && (zoom.k !== this.zoom?.k
                || zoom.x !== this.zoom?.x
                || zoom.y !== this.zoom?.y)
    ) {
      this.zoom = zoom;
      PARAMETERS$.next({ action: 'SaveParameters' });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  handleDragEnd() {
    POSITIONS$.next({ action: 'SavePositions' });
  }

  handleNodeClick(node, event) {
    if (event.ctrlKey || event.shiftKey || event.altKey) {
      if (this.selectedNodes.has(node)) {
        this.selectedNodes.delete(node);
      } else {
        this.selectedNodes.add(node);
      }
    } else {
      const untoggle = this.selectedNodes.has(node) && this.selectedNodes.size === 1;
      this.selectedNodes.clear();
      this.selectedLinks.clear();
      if (!untoggle) this.selectedNodes.add(node);
    }
    this.setState({
      numberOfSelectedNodes: this.selectedNodes.size,
      numberOfSelectedLinks: this.selectedLinks.size,
    });
  }

  /**
   *
   * @param nodes
   * @param links type {}
   */
  handleReNodeClick({nodes, links}) {
    this.selectedNodes.clear();
    Object.values(nodes).forEach((n) => this.selectedNodes.add(n));
    this.setState({
      numberOfSelectedNodes: this.selectedNodes.size,
      numberOfSelectedLinks: this.selectedLinks.size,
    });
  }

  handleLinkClick(link, event) {
    if (event.ctrlKey || event.shiftKey || event.altKey) {
      if (this.selectedLinks.has(link)) {
        this.selectedLinks.delete(link);
      } else {
        this.selectedLinks.add(link);
      }
    } else {
      const untoggle = this.selectedLinks.has(link) && this.selectedLinks.size === 1;
      this.selectedNodes.clear();
      this.selectedLinks.clear();
      if (!untoggle) {
        this.selectedLinks.add(link);
      }
    }
    this.setState({
      numberOfSelectedNodes: this.selectedNodes.size,
      numberOfSelectedLinks: this.selectedLinks.size,
    });
  }

  handleBackgroundClick() {
    this.selectedNodes.clear();
    this.selectedLinks.clear();
    this.setState({
      numberOfSelectedNodes: this.selectedNodes.size,
      numberOfSelectedLinks: this.selectedLinks.size,
    });
  }

  async handleAddEntity(stixCoreObject) {
    if (R.map((n) => n.id, this.graphObjects).includes(stixCoreObject.id)) return;
    this.graphObjects = [...this.graphObjects, stixCoreObject];
    this.graphData = buildGraphData(
      this.graphObjects,
      decodeGraphData(this.props.report.graph_data),
      this.props.t,
    );
    await this.resetAllFilters();
    const selectedTimeRangeInterval = computeTimeRangeInterval(
      this.graphObjects,
    );
    this.setState(
      {
        selectedTimeRangeInterval,
        graphData: applyFilters(
          this.graphData,
          this.state.stixCoreObjectsTypes,
          this.state.markedBy,
          this.state.createdBy,
          ignoredStixCoreObjectsTypes,
          selectedTimeRangeInterval,
        ),
      },
      () => {
        setTimeout(() => this.handleZoomToFit(), 1500);
      },
    );
  }

  async handleAddRelation(stixCoreRelationship) {
    const input = {
      toId: stixCoreRelationship.id,
      relationship_type: 'object',
    };
    commitMutation({
      mutation: reportKnowledgeGraphtMutationRelationAddMutation,
      variables: {
        id: this.props.report.id,
        input,
      },
      onCompleted: async () => {
        this.graphObjects = [...this.graphObjects, stixCoreRelationship];
        this.graphData = buildGraphData(
          this.graphObjects,
          decodeGraphData(this.props.report.x_opencti_graph_data),
          this.props.t,
        );
        await this.resetAllFilters();
        const selectedTimeRangeInterval = computeTimeRangeInterval(
          this.graphObjects,
        );
        this.setState({
          selectedTimeRangeInterval,
          graphData: applyFilters(
            this.graphData,
            this.state.stixCoreObjectsTypes,
            this.state.markedBy,
            this.state.createdBy,
            ignoredStixCoreObjectsTypes,
            selectedTimeRangeInterval,
          ),
        });
      },
    });
  }

  async handleDelete(stixCoreObject) {
    const relationshipsToRemove = R.filter(
      (n) => n.from?.id === stixCoreObject.id || n.to?.id === stixCoreObject.id,
      this.graphObjects,
    );
    this.graphObjects = R.filter(
      (n) => n.id !== stixCoreObject.id
                && n.from?.id !== stixCoreObject.id
                && n.to?.id !== stixCoreObject.id,
      this.graphObjects,
    );
    this.graphData = buildGraphData(
      this.graphObjects,
      decodeGraphData(this.props.report.x_opencti_graph_data),
      this.props.t,
    );
    await this.resetAllFilters();
    R.forEach((n) => {
      commitMutation({
        mutation: reportKnowledgeGraphMutationRelationDeleteMutation,
        variables: {
          id: this.props.report.id,
          toId: n.id,
          relationship_type: 'object',
        },
      });
    }, relationshipsToRemove);
    this.setState({
      graphData: applyFilters(
        this.graphData,
        this.state.stixCoreObjectsTypes,
        this.state.markedBy,
        this.state.createdBy,
        ignoredStixCoreObjectsTypes,
        this.state.selectedTimeRangeInterval,
        this.state.keyword,
      ),
    });
  }

  async handleDeleteSelected(deleteObject = false) {
    // Remove selected links
    const selectedLinks = Array.from(this.selectedLinks);
    const selectedLinksIds = R.map((n) => n.id, selectedLinks);
    R.forEach((n) => {
      fetchQuery(reportKnowledgeGraphCheckObjectQuery, {
        id: n.id,
      })
        .toPromise()
        .then(async (data) => {
          if (
            deleteObject
                        && !data.stixObjectOrStixRelationship.is_inferred
                        && data.stixObjectOrStixRelationship.reports.edges.length === 1
          ) {
            commitMutation({
              mutation: reportKnowledgeGraphQueryStixRelationshipDeleteMutation,
              variables: {
                id: n.id,
              },
            });
          } else {
            commitMutation({
              mutation: reportKnowledgeGraphMutationRelationDeleteMutation,
              variables: {
                id: this.props.report.id,
                toId: n.id,
                relationship_type: 'object',
              },
            });
          }
        });
    }, this.selectedLinks);
    this.graphObjects = R.filter(
      (n) => !R.includes(n.id, selectedLinksIds),
      this.graphObjects,
    );
    this.selectedLinks.clear();

    // Remove selected nodes
    const selectedNodes = Array.from(this.selectedNodes);
    const selectedNodesIds = R.map((n) => n.id, selectedNodes);
    const relationshipsToRemove = R.filter(
      (n) => R.includes(n.from?.id, selectedNodesIds)
                || R.includes(n.to?.id, selectedNodesIds),
      this.graphObjects,
    );
    this.graphObjects = R.filter(
      (n) => !R.includes(n.id, selectedNodesIds)
                && !R.includes(n.from?.id, selectedNodesIds)
                && !R.includes(n.to?.id, selectedNodesIds),
      this.graphObjects,
    );
    R.forEach((n) => {
      commitMutation({
        mutation: reportKnowledgeGraphMutationRelationDeleteMutation,
        variables: {
          id: this.props.report.id,
          toId: n.id,
          relationship_type: 'object',
        },
      });
    }, relationshipsToRemove);
    R.forEach((n) => {
      fetchQuery(reportKnowledgeGraphCheckObjectQuery, {
        id: n.id,
      })
        .toPromise()
        .then(async (data) => {
          if (
            deleteObject
                        && !data.stixObjectOrStixRelationship.is_inferred
                        && data.stixObjectOrStixRelationship.reports.edges.length === 1
          ) {
            commitMutation({
              mutation: reportKnowledgeGraphQueryStixObjectDeleteMutation,
              variables: {
                id: n.id,
              },
            });
          } else {
            commitMutation({
              mutation: reportKnowledgeGraphMutationRelationDeleteMutation,
              variables: {
                id: this.props.report.id,
                toId: n.id,
                relationship_type: 'object',
              },
            });
          }
        });
    }, selectedNodes);
    this.selectedNodes.clear();
    this.graphData = buildGraphData(
      this.graphObjects,
      decodeGraphData(this.props.report.x_opencti_graph_data),
      this.props.t,
    );
    await this.resetAllFilters();
    this.setState({
      graphData: applyFilters(
        this.graphData,
        this.state.stixCoreObjectsTypes,
        this.state.markedBy,
        this.state.createdBy,
        ignoredStixCoreObjectsTypes,
        this.state.selectedTimeRangeInterval,
        this.state.keyword,
      ),
      numberOfSelectedNodes: this.selectedNodes.size,
      numberOfSelectedLinks: this.selectedLinks.size,
    });
  }

  handleCloseEntityEdition(entityId) {
    setTimeout(() => {
      fetchQuery(reportKnowledgeGraphStixCoreObjectQuery, {
        id: entityId,
      })
        .toPromise()
        .then((data) => {
          const { stixCoreObject } = data;
          this.graphObjects = R.map(
            (n) => (n.id === stixCoreObject.id ? stixCoreObject : n),
            this.graphObjects,
          );
          this.graphData = buildGraphData(
            this.graphObjects,
            decodeGraphData(this.props.report.x_opencti_graph_data),
            this.props.t,
          );
          this.setState({
            graphData: applyFilters(
              this.graphData,
              this.state.stixCoreObjectsTypes,
              this.state.markedBy,
              this.state.createdBy,
              ignoredStixCoreObjectsTypes,
              this.state.selectedTimeRangeInterval,
              this.state.keyword,
            ),
          });
        });
    }, 1500);
  }

  handleCloseRelationEdition(relationId) {
    setTimeout(() => {
      fetchQuery(reportKnowledgeGraphStixRelationshipQuery, {
        id: relationId,
      })
        .toPromise()
        .then((data) => {
          const { stixRelationship } = data;
          this.graphObjects = R.map(
            (n) => (n.id === stixRelationship.id ? stixRelationship : n),
            this.graphObjects,
          );
          this.graphData = buildGraphData(
            this.graphObjects,
            decodeGraphData(this.props.report.x_opencti_graph_data),
            this.props.t,
          );
          this.setState({
            graphData: applyFilters(
              this.graphData,
              this.state.stixCoreObjectsTypes,
              this.state.markedBy,
              this.state.createdBy,
              ignoredStixCoreObjectsTypes,
              this.state.selectedTimeRangeInterval,
              this.state.keyword,
            ),
          });
        });
    }, 1500);
  }

  inSelectionRect(n) {
    const graphOrigin = this.graph.current.screen2GraphCoords(
      this.state.rectSelected.origin[0],
      this.state.rectSelected.origin[1],
    );
    const graphTarget = this.graph.current.screen2GraphCoords(
      this.state.rectSelected.target[0],
      this.state.rectSelected.target[1],
    );
    return (
      n.x >= graphOrigin.x
            && n.x <= graphTarget.x
            && n.y >= graphOrigin.y
            && n.y <= graphTarget.y
    );
  }

  handleRectSelectMove(e, coords) {
    if (this.state.selectModeFree) {
      const container = document.getElementsByTagName('canvas')[0];
      const { left, top } = container.getBoundingClientRect();
      this.state.rectSelected.origin[0] = R.min(coords.origin[0], coords.target[0]) - left;
      this.state.rectSelected.origin[1] = R.min(coords.origin[1], coords.target[1]) - top;
      this.state.rectSelected.target[0] = R.max(coords.origin[0], coords.target[0]) - left;
      this.state.rectSelected.target[1] = R.max(coords.origin[1], coords.target[1]) - top;
      this.state.rectSelected.shiftKey = e.shiftKey;
      this.state.rectSelected.altKey = e.altKey;
    }
  }

  handleRectSelectUp() {
    if (
      this.state.selectModeFree
            && (this.state.rectSelected.origin[0]
                !== this.state.rectSelected.target[0]
                || this.state.rectSelected.origin[1] !== this.state.rectSelected.target[1])
    ) {
      if (
        !this.state.rectSelected.shiftKey
                && !this.state.rectSelected.altKey
      ) {
        this.selectedLinks.clear();
        this.selectedNodes.clear();
      }
      if (this.state.rectSelected.altKey) {
        R.map(
          (n) => this.inSelectionRect(n) && this.selectedNodes.delete(n),
          this.state.graphData.nodes,
        );
      } else {
        R.map(
          (n) => this.inSelectionRect(n) && this.selectedNodes.add(n),
          this.state.graphData.nodes,
        );
      }
      this.setState({ numberOfSelectedNodes: this.selectedNodes.size });
    }
    this.state.rectSelected = {
      origin: [0, 0],
      target: [0, 0],
      shiftKey: false,
      altKey: false,
    };
  }

  handleSelectAll() {
    this.selectedLinks.clear();
    this.selectedNodes.clear();
    R.map((n) => this.selectedNodes.add(n), this.state.graphData.nodes);
    this.setState({ numberOfSelectedNodes: this.selectedNodes.size });
  }

  handleSelectByType(type) {
    this.selectedLinks.clear();
    this.selectedNodes.clear();
    R.map(
      (n) => n.entity_type === type && this.selectedNodes.add(n),
      this.state.graphData.nodes,
    );
    this.setState({ numberOfSelectedNodes: this.selectedNodes.size });
  }

  handleResetLayout() {
    this.graphData = buildGraphData(this.graphObjects, {}, this.props.t);
    this.setState(
      {
        graphData: applyFilters(
          this.graphData,
          this.state.stixCoreObjectsTypes,
          this.state.markedBy,
          this.state.createdBy,
          ignoredStixCoreObjectsTypes,
          this.state.selectedTimeRangeInterval,
          this.state.keyword,
        ),
      },
      () => {
        this.handleDragEnd();
        this.forceUpdate();
        this.graph.current.d3ReheatSimulation();
        POSITIONS$.next({ action: 'SavePositions' });
      },
    );
  }

  handleApplySuggestion() {
    this.forceUpdate();
  }

  handleTimeRangeChange(selectedTimeRangeInterval) {
    this.setState({
      selectedTimeRangeInterval,
      graphData: applyFilters(
        this.graphData,
        this.state.stixCoreObjectsTypes,
        this.state.markedBy,
        this.state.createdBy,
        [],
        selectedTimeRangeInterval,
        this.state.keyword,
      ),
    });
  }

  handleSearch(keyword) {
    this.setState({
      keyword,
      graphData: applyFilters(
        this.graphData,
        this.state.stixCoreObjectsTypes,
        this.state.markedBy,
        this.state.createdBy,
        [],
        this.state.selectedTimeRangeInterval,
        keyword,
      ),
    });
  }

  isUnGroupingEnabled() {
    return this.selectedNodes.length > 1;
    // implement if selectedNodes has group name
    // or just use regraph combinedNodes ...
  }

  handleGroupSelectedNodes(selectedNodes) {
    console.log(selectedNodes);
    this.setState({
      graphData: groupSelectedNodes(selectedNodes, this.graphData, this.graphObjects),
    });
  }

  handleUpdateGraphData(event) {
    this.setState((prev) => ({
      graphData: {
        links: prev.graphData.links,
        nodes: prev.graphData.nodes.map((n) => {
          const position = event.positions[n.id];
          if (!position) return n;
          return {
            ...n,
            x: position.x,
            y: position.y,
          };
        }),
      },
    }));
  }

  render() {
    const { report, mode } = this.props;
    const {
      mode3D,
      modeFixed,
      modeTree,
      allStixCoreObjectsTypes,
      allMarkedBy,
      allCreatedBy,
      stixCoreObjectsTypes,
      selectModeFree,
      markedBy,
      createdBy,
      graphData,
      numberOfSelectedNodes,
      numberOfSelectedLinks,
      displayTimeRange,
      selectedTimeRangeInterval,
      width,
      height,
      navOpen,
    } = this.state;
    const selectedEntities = [...this.selectedLinks, ...this.selectedNodes];
    const graphWidth = width || window.innerWidth - (navOpen ? 210 : 70);
    const graphHeight = height || window.innerHeight - 180;
    const displayLabels = graphData.links.length < 200;
    const timeRangeInterval = computeTimeRangeInterval(this.graphObjects);
    const timeRangeValues = computeTimeRangeValues(
      timeRangeInterval,
      this.graphObjects,
    );

    return (
            <div>
                <ContainerHeader
                    container={report}
                    PopoverComponent={<ReportPopover/>}
                    link={`/dashboard/analysis/reports/${report.id}/knowledge`}
                    modes={['graph', 'timeline', 'correlation', 'matrix']}
                    currentMode={mode}
                    adjust={this.handleZoomToFit.bind(this)}
                    knowledge={true}
                    enableSuggestions={true}
                    onApplied={this.handleApplySuggestion.bind(this)}
                />
                <ReportKnowledgeGraphBar
                    handleToggle3DMode={this.handleToggle3DMode.bind(this)}
                    currentMode3D={mode3D}
                    handleToggleTreeMode={this.handleToggleTreeMode.bind(this)}
                    currentModeTree={modeTree}
                    handleToggleFixedMode={this.handleToggleFixedMode.bind(this)}
                    currentModeFixed={modeFixed}
                    handleZoomToFit={this.handleZoomToFit.bind(this)}
                    handleToggleCreatedBy={this.handleToggleCreateBy.bind(this)}
                    handleToggleStixCoreObjectType={this.handleToggleStixCoreObjectType.bind(
                      this,
                    )}
                    handleToggleMarkedBy={this.handleToggleMarkedBy.bind(this)}
                    handleToggleSelectModeFree={this.handleToggleSelectModeFree.bind(
                      this,
                    )}
                    stixCoreObjectsTypes={allStixCoreObjectsTypes}
                    currentStixCoreObjectsTypes={stixCoreObjectsTypes}
                    currentSelectModeFree={selectModeFree}
                    markedBy={allMarkedBy}
                    currentMarkedBy={markedBy}
                    createdBy={allCreatedBy}
                    currentCreatedBy={createdBy}
                    handleSelectAll={this.handleSelectAll.bind(this)}
                    handleSelectByType={this.handleSelectByType.bind(this)}
                    report={report}
                    onAdd={this.handleAddEntity.bind(this)}
                    onDelete={this.handleDelete.bind(this)}
                    onAddRelation={this.handleAddRelation.bind(this)}
                    handleDeleteSelected={this.handleDeleteSelected.bind(this)}
                    selectedNodes={Array.from(this.selectedNodes)}
                    selectedLinks={Array.from(this.selectedLinks)}
                    numberOfSelectedNodes={numberOfSelectedNodes}
                    numberOfSelectedLinks={numberOfSelectedLinks}
                    handleCloseEntityEdition={this.handleCloseEntityEdition.bind(this)}
                    handleCloseRelationEdition={this.handleCloseRelationEdition.bind(
                      this,
                    )}
                    handleResetLayout={this.handleResetLayout.bind(this)}
                    displayTimeRange={displayTimeRange}
                    handleToggleDisplayTimeRange={this.handleToggleDisplayTimeRange.bind(
                      this,
                    )}
                    timeRangeInterval={timeRangeInterval}
                    selectedTimeRangeInterval={selectedTimeRangeInterval}
                    handleTimeRangeChange={this.handleTimeRangeChange.bind(this)}
                    timeRangeValues={timeRangeValues}
                    handleSearch={this.handleSearch.bind(this)}
                    navOpen={navOpen}
                    isUnGroupingEnabled={this.isUnGroupingEnabled.bind(this)}
                    groupSelectedNodes={this.handleGroupSelectedNodes.bind(this)}
                    ungroupSelectedNodes={()=>{this.refForRegraph.current.uncombineSelection()}}
                />
                {selectedEntities.length > 0 && (
                    <EntitiesDetailsRightsBar
                        selectedEntities={selectedEntities}
                        navOpen={navOpen}
                    />
                )}
            <Regraph
                selectedNodes={this.selectedNodes}
                graphData={graphData}
                handleReNodeClick={this.handleReNodeClick.bind(this)}
                handleUpdateGraphData={this.handleUpdateGraphData.bind(this)}
                saveRePositions={this.saveRePositions.bind(this)}
                handleGroupSelectedNodes={this.handleGroupSelectedNodes.bind(this)}
                ref={this.refForRegraph}
            />
            </div>
    );
  }
}

ReportKnowledgeGraphComponent.propTypes = {
  report: PropTypes.object,
  classes: PropTypes.object,
  theme: PropTypes.object,
  mode: PropTypes.string,
  t: PropTypes.func,
};

const ReportKnowledgeGraph = createFragmentContainer(
  ReportKnowledgeGraphComponent,
  {
    report: graphql`
            fragment ReportKnowledgeGraph_report on Report {
                id
                name
                x_opencti_graph_data
                published
                confidence
                createdBy {
                    ... on Identity {
                        id
                        name
                        entity_type
                    }
                }
                objectMarking {
                    edges {
                        node {
                            id
                            definition_type
                            definition
                            x_opencti_order
                            x_opencti_color
                        }
                    }
                }
                objects(all: true) {
                    edges {
                        types
                        node {
                            ... on BasicObject {
                                id
                                entity_type
                                parent_types
                            }
                            ... on StixCoreObject {
                                created_at
                                createdBy {
                                    ... on Identity {
                                        id
                                        name
                                        entity_type
                                    }
                                }
                                objectMarking {
                                    edges {
                                        node {
                                            id
                                            definition_type
                                            definition
                                            x_opencti_order
                                            x_opencti_color
                                        }
                                    }
                                }
                            }
                            ... on StixDomainObject {
                                is_inferred
                                created
                            }
                            ... on AttackPattern {
                                name
                                x_mitre_id
                            }
                            ... on Campaign {
                                name
                                first_seen
                                last_seen
                            }
                            ... on ObservedData {
                                name
                            }
                            ... on CourseOfAction {
                                name
                            }
                            ... on Note {
                                attribute_abstract
                                content
                            }
                            ... on Opinion {
                                opinion
                            }
                            ... on Report {
                                name
                                published
                            }
                            ... on Grouping {
                                name
                            }
                            ... on Individual {
                                name
                            }
                            ... on Organization {
                                name
                            }
                            ... on Sector {
                                name
                            }
                            ... on System {
                                name
                            }
                            ... on Indicator {
                                name
                                valid_from
                            }
                            ... on Infrastructure {
                                name
                            }
                            ... on IntrusionSet {
                                name
                                first_seen
                                last_seen
                            }
                            ... on Position {
                                name
                            }
                            ... on City {
                                name
                            }
                            ... on AdministrativeArea {
                                name
                            }
                            ... on Country {
                                name
                            }
                            ... on Region {
                                name
                            }
                            ... on Malware {
                                name
                                first_seen
                                last_seen
                            }
                            ... on ThreatActor {
                                name
                                first_seen
                                last_seen
                            }
                            ... on Tool {
                                name
                            }
                            ... on Vulnerability {
                                name
                            }
                            ... on Incident {
                                name
                                first_seen
                                last_seen
                            }
                            ... on Event {
                                name
                                description
                                start_time
                                stop_time
                            }
                            ... on Channel {
                                name
                                description
                            }
                            ... on Narrative {
                                name
                                description
                            }
                            ... on Language {
                                name
                            }
                            ... on DataComponent {
                                name
                            }
                            ... on DataSource {
                                name
                            }
                            ... on Case {
                                name
                            }
                            ... on StixCyberObservable {
                                observable_value
                            }
                            ... on StixFile {
                                observableName: name
                            }
                            ... on Label {
                                value
                                color
                            }
                            ... on MarkingDefinition {
                                definition
                                x_opencti_color
                            }
                            ... on KillChainPhase {
                                kill_chain_name
                                phase_name
                            }
                            ... on ExternalReference {
                                url
                                source_name
                            }
                            ... on BasicRelationship {
                                id
                                entity_type
                                parent_types
                            }
                            ... on BasicRelationship {
                                id
                                entity_type
                                parent_types
                            }
                            ... on StixCoreRelationship {
                                relationship_type
                                start_time
                                stop_time
                                confidence
                                created
                                is_inferred
                                from {
                                    ... on BasicObject {
                                        id
                                        entity_type
                                        parent_types
                                    }
                                    ... on BasicRelationship {
                                        id
                                        entity_type
                                        parent_types
                                    }
                                    ... on StixCoreRelationship {
                                        relationship_type
                                    }
                                }
                                to {
                                    ... on BasicObject {
                                        id
                                        entity_type
                                        parent_types
                                    }
                                    ... on BasicRelationship {
                                        id
                                        entity_type
                                        parent_types
                                    }
                                    ... on StixCoreRelationship {
                                        relationship_type
                                    }
                                }
                                created_at
                                createdBy {
                                    ... on Identity {
                                        id
                                        name
                                        entity_type
                                    }
                                }
                                objectMarking {
                                    edges {
                                        node {
                                            id
                                            definition_type
                                            definition
                                            x_opencti_order
                                            x_opencti_color
                                        }
                                    }
                                }
                            }
                            ... on StixRefRelationship {
                                relationship_type
                                start_time
                                stop_time
                                confidence
                                is_inferred
                                from {
                                    ... on BasicObject {
                                        id
                                        entity_type
                                        parent_types
                                    }
                                    ... on BasicRelationship {
                                        id
                                        entity_type
                                        parent_types
                                    }
                                    ... on StixCoreRelationship {
                                        relationship_type
                                    }
                                }
                                to {
                                    ... on BasicObject {
                                        id
                                        entity_type
                                        parent_types
                                    }
                                    ... on BasicRelationship {
                                        id
                                        entity_type
                                        parent_types
                                    }
                                    ... on StixCoreRelationship {
                                        relationship_type
                                    }
                                }
                                created_at
                                datable
                                objectMarking {
                                    edges {
                                        node {
                                            id
                                            definition_type
                                            definition
                                            x_opencti_order
                                            x_opencti_color
                                        }
                                    }
                                }
                            }
                            ... on StixSightingRelationship {
                                relationship_type
                                first_seen
                                last_seen
                                confidence
                                created
                                is_inferred
                                from {
                                    ... on BasicObject {
                                        id
                                        entity_type
                                        parent_types
                                    }
                                    ... on BasicRelationship {
                                        id
                                        entity_type
                                        parent_types
                                    }
                                    ... on StixCoreRelationship {
                                        relationship_type
                                    }
                                }
                                to {
                                    ... on BasicObject {
                                        id
                                        entity_type
                                        parent_types
                                    }
                                    ... on BasicRelationship {
                                        id
                                        entity_type
                                        parent_types
                                    }
                                    ... on StixCoreRelationship {
                                        relationship_type
                                    }
                                }
                                created_at
                                createdBy {
                                    ... on Identity {
                                        id
                                        name
                                        entity_type
                                    }
                                }
                                objectMarking {
                                    edges {
                                        node {
                                            id
                                            definition_type
                                            definition
                                            x_opencti_order
                                            x_opencti_color
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                ...ContainerHeader_container
            }
        `,
  },
);

export default R.compose(
  inject18n,
  withRouter,
  withTheme,
)(ReportKnowledgeGraph);
