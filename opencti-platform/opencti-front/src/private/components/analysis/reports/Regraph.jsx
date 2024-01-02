import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Chart } from 'regraph';
import has from 'lodash/has';
import mapValues from 'lodash/mapValues';
import merge from 'lodash/merge';
import omit from 'lodash/omit';
import { useTheme } from '@mui/material/styles';
import { Menu } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import { reGraphData } from '../../../../utils/Graph';

function isLink(item) {
  return has(item, 'id1');
}

function isSummaryLink(id) {
  return id.startsWith('_combolink_');
}
const ContextMenu = ({ close, open, x, y, menuOnNode, canBeLinked }) => {
  return (
        <Menu
            anchorReference="anchorPosition"
            anchorPosition={{ top: y, left: x }}
            open={open}
        >
            {menuOnNode !== null ? <MenuItem onClick={close}>Edit</MenuItem> : null}
            {canBeLinked ? <MenuItem onClick={close}>Link</MenuItem> : null}
            <MenuItem onClick={close}>Create</MenuItem>
        </Menu>
  );
};

export const Regraph = forwardRef((props, ref) => {
  const { graphData, handleReNodeClick } = props;
  const theme = useTheme();
  const [dragSelector, setDragSelector] = useState(false);
  const [menuOpen, setOpenMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [menuOnNode, setMenuOnNode] = useState(null);
  const [state, setState] = useState({
    selection: {},
    items: reGraphData(graphData),
    openCombos: {},
    combine: {
      level: 1,
      properties: ['group'],
    },
    layout: { tightness: 8 },
  });
  const comboLookup = React.useRef({});
  const nextComboId = React.useRef(0);

  const lowestCombineLevelOnCombo = (combine, combo) => {
    for (let i = 0; i < combine.properties.length; i += 1) {
      const level = combine.properties[i];
      if (combo[level]) {
        return level;
      }
    }
    return undefined;
  };

  const combineNodesHandler = ({ setStyle, id, nodes, combo }) => {
    const { openCombos, combine } = state;

    // the lookup property needs to be the lowest level in the combo list
    comboLookup.current[id] = {
      nodes,
      combo,
      property: lowestCombineLevelOnCombo(combine, combo),
    };

    setStyle({
      open: !!openCombos[id],
      size: 1.2,
      color: '#eefcf8',
      border: { width: 2, color: '#8cedd0' },
      arrange: 'concentric',
      label: { text: 'Group' },
      closedStyle: {
        color: '#2dcda8',
        border: {},
        label: [
          {
            text: 'Group',
            position: 's',
          },
        ],
      },
    });
  };

  const combineLinksHandler = ({ setStyle }) => {
    setStyle({
      color: '#6699ff',
      width: 5,
    });
  };

  const doubleClickHandler = ({ id }) => {
    // if the id is a comboId, we want to toggle its open state
    if (comboLookup.current[id]) {
      setState((current) => {
        const { combine, openCombos } = current;
        return {
          ...current,
          combine: { ...combine },
          openCombos: { ...openCombos, [id]: !openCombos[id] },
        };
      });
    }
  };

  const chartChangeHandler = (change) => {
    const { selection } = change;
    if (selection) {
      handleReNodeClick(selection);
      setState((current) => {
        return { ...current, selection };
      });
    }
  };

  // this function returns all the nodes that are selected directly
  // plus any nodes that are contained inside selected combos
  const underlyingSelectedNodes = () => {
    const { selection } = state;
    let underlying = {};
    Object.keys(selection).forEach((id) => {
      const nodes = comboLookup.current[id] && comboLookup.current[id].nodes;
      if (nodes) {
        underlying = { ...underlying, ...nodes };
      } else if (!isLink(id) && !isSummaryLink(id)) {
        underlying[id] = selection[id];
      }
    });
    return underlying;
  };

  const combineSelection = () => {
    const { selection, items, combine } = state;
    const { level, properties } = combine;

    // Calculate the new level of grouping.
    // If the selection contains combos, the new level needs to be higher than the
    // existing highest in the selection.
    const depths = Object.keys(selection)
      .filter((key) => comboLookup.current[key])
      .map((key) => Object.keys(selection[key]).length);

    const newLevel = depths.length > 0 ? Math.max(...depths) + 1 : 1;

    // find the nodes and add the property to their data properties
    const nodesToChange = underlyingSelectedNodes();
    // adding the same property to the nodes will cause them to combine
    nextComboId.current += 1;
    const levelName = `level${newLevel}`;
    const dataProp = { [levelName]: `combo${nextComboId.current}` };
    const withProperties = mapValues(nodesToChange, (node) => merge({}, node, { data: dataProp }));

    // 'higher' tells us if we have added a level. If we have then we'll
    // need to update the combine property too in the setState call.
    const higher = newLevel > level;

    setState((current) => {
      return {
        ...current,
        items: { ...items, ...withProperties },
        combine: {
          level: higher ? newLevel : level,
          properties: higher ? properties.concat(levelName) : properties,
        },
      };
    });
  };

  const uncombineSelection = () => {
    const { items, selection } = state;
    let uncombined = {};
    Object.keys(selection).forEach((id) => {
      if (comboLookup.current[id]) {
        const { nodes, property } = comboLookup.current[id];
        const newNodes = mapValues(nodes, (node) => omit(node, `data.${property}`));
        uncombined = { ...uncombined, ...newNodes };
      }
    });
    setState((current) => {
      return { ...current, items: { ...items, ...uncombined } };
    });
  };

  useImperativeHandle(ref, () => ({
    uncombineSelection,
  }));

  const contextMenu = (event) => {
    setMenuOnNode(event.id);
    setOpenMenu(true);
    setMenuPosition({ x: event.x, y: event.y });
  };

  const canBeLinked= props.selectedNodes.length === 2;


  return (
        <div
            onContextMenu={(e) => e.preventDefault()}
            style={{ width: '100%', height: '100%' }}
        >
            <Chart
                style={{ height: '950px' }}
                items={state.items}
                selection={state.selection}
                combine={state.combine}
                layout={state.layout}
                options={{
                  iconFontFamily: 'Font Awesome 5 Free',
                  imageAlignment: {
                    'fa-user': { size: 0.9 },
                    'fa-users': { size: 0.85 },
                  },
                  handMode: dragSelector,
                  navigation: false,
                  overview: false,
                  backgroundColor: theme.palette.background.default,
                }}
                animation={{ time: 600 }}
                onCombineNodes={combineNodesHandler}
                onCombineLinks={combineLinksHandler}
                onChange={chartChangeHandler}
                onDoubleClick={doubleClickHandler}
                onContextMenu={contextMenu}
            />
            <ContextMenu
                close={() => setOpenMenu(false)}
                open={menuOpen}
                x={menuPosition.x}
                y={menuPosition.y}
                menuOnNode={menuOnNode}
                canBeLinked={canBeLinked}
            />
        </div>
  );
});
