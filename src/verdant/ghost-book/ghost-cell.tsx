import * as React from "react";
import {History} from "../../lilgit/model/history";
import {NodeyCode} from "../../lilgit/model/nodey";
import {Sampler} from "../../lilgit/model/sampler";
import {VersionSampler} from "../sampler/version-sampler";
import GhostCellLabel from "./ghost-cell-label";
import GhostCellOutput from "./ghost-cell-output";
import {connect} from "react-redux";
import {verdantState} from "../redux/index";
import {focusCell} from "../redux/ghost";
import {Checkpoint} from "../../lilgit/model/checkpoint";

/* CSS Constants */
const CONTAINER = "v-Verdant-GhostBook-container";
const CONTAINER_STACK = `${CONTAINER}-stack`;

const CELL = "v-Verdant-GhostBook-cell";
const CELL_BAND = `${CELL}-band`;
const CELL_CONTAINER = `${CELL}-container`;
const CELL_CONTENT = `${CELL}-content`;

export type GhostCell_Props = {
  // The index of the cell
  id?: number;
  // Entire state history. Used for VersionSampler
  history?: History;
  // String id of the cell
  name: string;
  // Index of the cell's output cell (for a code cell) in state.GhostCells
  output?: string;
  // Checkpoints associated with the cell
  events?: Checkpoint[];
  // On-click action
  clickEv?: () => void;
  // On-focus action
  hasFocus?: () => boolean;
}

type GhostCell_State = {
  sample: string;
}

class GhostCell extends React.Component<GhostCell_Props, GhostCell_State> {
  constructor(props) {
    /* Explicit constructor to initialize state */
    // Required super call
    super(props);
    // Set state
    this.state = {
      sample: "",
    }
  }

  render() {
    /* Render cell */

    // Asynchronously update innerHTML if change has occurred
    this.updateSample();

    let nodey = this.props.history.store.get(this.props.name);
    if (!nodey) {
      // ERROR case
      console.error("ERROR: CAN'T FIND GHOST CELL", this.props.name);
      return null;
    }
    let active = this.props.hasFocus() ? "active" : "";
    console.log(this.props.name);

    return (
      <div
        className={`${CONTAINER} ${active}`}
        onClick={() => this.props.clickEv()}
      >
        <div className={`${CELL_BAND} ${active}`}/>
        <div className={CONTAINER_STACK}>
          <div className={CELL_CONTAINER}>
            <GhostCellLabel name={this.props.name} events={this.props.events}/>
            <div className={`${CELL_CONTENT} ${active}`}>
              <div
                className={`${CELL} ${this.props.name.charAt(0)}  ${active}`}
                dangerouslySetInnerHTML={{__html: this.state.sample}}
              />
            </div>
          </div>
          {nodey instanceof NodeyCode && nodey.output ?
            <GhostCellOutput name={this.props.output}/> : null}
        </div>
      </div>
    );
  }

  private async updateSample() {
    /* Update the sample HTML if it has changed */
    let newSample = await this.getSample();
    if (newSample.outerHTML != this.state.sample)
      this.setState({sample: newSample.outerHTML});
  }

  private async getSample() {
    /* Get the new sample HTML */
    let nodey = this.props.history.store.get(this.props.name);
    if (!nodey) {
      // ERROR case
      console.error("ERROR: CAN'T FIND GHOST CELL", this.props.name);
    } else {
      let diff;
      if (this.props.events === undefined || this.props.events.length === 0) {
        diff = Sampler.NO_DIFF;
      } else {
        diff = Sampler.CHANGE_DIFF;
      }
      return VersionSampler.sample(
        this.props.history,
        nodey,
        null,
        diff
      );
    }
  }
}

const mapStateToProps = (state: verdantState, ownProps: GhostCell_Props) => {
  return {
    history: state.getHistory(),
    hasFocus: () => state.active_cell === ownProps.name
  };
};

const mapDispatchToProps = (dispatch: any, ownProps: GhostCell_Props) => {
  return {
    clickEv: () => dispatch(focusCell(ownProps.name)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(GhostCell);
