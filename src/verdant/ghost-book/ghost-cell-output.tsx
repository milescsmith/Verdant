import * as React from "react";
import { Namer, DIFF_TYPE } from "../../lilgit/sampler";
import { VersionSampler } from "../sampler/version-sampler";
import { History } from "../../lilgit/history";
import { NodeyOutput, Nodey } from "../../lilgit/nodey";
import { connect } from "react-redux";
import { verdantState, showDetailOfNode } from "../redux/";

type GhostCellOutput_Props = {
  // String id of the output cell
  name: string;
  // Entire state history. Used for VersionSampler
  history: History;
  // open up detail of nodey
  showDetail: (n: Nodey) => void;
  inspectOn: boolean;
  changed: boolean;
  nodey: NodeyOutput[];
  notebookVer: number;
};

type GhostCellOutput_State = {
  sample: string;
};

class GhostCellOutput extends React.Component<
  GhostCellOutput_Props,
  GhostCellOutput_State
> {
  /*
   * Component to render output of a code ghost cell.
   * */
  constructor(props) {
    /* Explicit constructor to initialize state */
    // Required super call
    super(props);
    // Set state
    this.state = {
      sample: "",
    };
  }

  render() {
    /* Render cell output */

    // Conditionally update HTML
    this.updateSample();

    // If output is empty, return nothing
    if (this.state.sample.length === 0) return null;

    let output = this.props.nodey[0];

    return (
      <div
        className={`v-Verdant-GhostBook-cell-container output${
          this.props.inspectOn ? " hoverInspect" : ""
        }${this.props.changed ? " changed" : ""}`}
        onClick={() => {
          if (this.props.inspectOn) this.props.showDetail(output);
        }}
      >
        <div
          className="v-Verdant-GhostBook-cell-label"
          onClick={() => this.props.showDetail(output)}
        >
          {Namer.getOutputVersionTitle(output, this.props.history)}
        </div>{" "}
        <div className="v-Verdant-GhostBook-cell-header" />
        <div className="v-Verdant-GhostBook-cell-content">
          <div className="v-Verdant-GhostBook-cell">
            <div dangerouslySetInnerHTML={{ __html: this.state.sample }} />
          </div>
        </div>
      </div>
    );
  }

  private async updateSample() {
    /* Update the sample HTML if it has changed */
    let newSample = await this.getSample();
    if (
      newSample === undefined && // sample is undefined and
      this.state.sample !== "" // sample has not been reset
    ) {
      // undefined samples are reset to blank
      this.setState({ sample: "" });
    } else if (
      newSample !== undefined && // sample is not undefined
      this.state.sample !== newSample.outerHTML // sample has not been updated
    ) {
      // new samples update state
      this.setState({ sample: newSample.outerHTML });
    }
  }

  async getSample() {
    // Get output HTML
    let output = this.props.nodey[0];
    if (output.raw.length > 0) {
      // Attach diffs to output
      return VersionSampler.sampleDiff(
        this.props.history,
        output,
        DIFF_TYPE.NO_DIFF,
        this.props.notebookVer
      );
    }
  }
}

const mapStateToProps = (
  state: verdantState,
  ownProps: Partial<GhostCellOutput_Props>
) => {
  const history = state.getHistory();
  const outHist = history?.store?.getHistoryOf(ownProps.name);
  const nodey = outHist?.getAllVersions() || [];
  const notebookVer = state.ghostBook.notebook_ver;

  return {
    nodey,
    history,
    inspectOn: state.artifactView.inspectOn,
    notebookVer,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    showDetail: (n: Nodey) => dispatch(showDetailOfNode(n)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(GhostCellOutput);
