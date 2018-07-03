import { NodeyCode } from "../nodey";

import { HistoryModel } from "../history-model";

/*
*
*/
export namespace ASTUtils {
  /*
  *
  */
  export function findNodeAtRange(
    nodey: NodeyCode,
    change: { start: any; end: any },
    historyModel: HistoryModel
  ): NodeyCode {
    return Private._findNodeAtRange(
      nodey,
      0,
      Math.max(0, nodey.getChildren().length - 1),
      change,
      historyModel
    );
  }

  /*
  *
  */
  //return 0 for match, 1 for to the right, -1 for to the left, 2 for both
  export function inRange(
    nodey: NodeyCode,
    change: { start: any; end: any }
  ): number {
    var val = 0;
    if (change.start.line < nodey.start.line) val = -1;
    else if (
      change.start.line === nodey.start.line &&
      change.start.ch < nodey.start.ch
    )
      val = -1;

    if (change.end.line > nodey.end.line) {
      if (val === -1) val = 2;
      else val = 1;
    } else if (
      change.end.line === nodey.end.line &&
      change.end.ch > nodey.end.ch
    ) {
      if (val === -1) val = 2;
      else val = 1;
    }
    return val;
  }

  /*
  *
  */
  export function reduceASTDict(ast: {
    [key: string]: any;
  }): { [key: string]: any } {
    if (ast.content && ast.content.length === 1) {
      // check if this node is a wrapper or not
      var child = ast.content[0];
      if (
        child.start.line === ast.start.line &&
        child.start.ch === ast.start.ch &&
        child.end.line === ast.end.line &&
        child.end.ch === ast.end.ch
      )
        return reduceASTDict(child);
    }
    return ast;
  }
}

namespace Private {
  /*
  *
  */
  export function _findNodeAtRange(
    node: NodeyCode,
    min: number,
    max: number,
    change: { start: any; end: any },
    historyModel: HistoryModel
  ): NodeyCode {
    var children: string[] = node.getChildren();
    var match = null;
    var mid = Math.floor((max - min) / 2) + min;
    var midNodey = <NodeyCode>historyModel.getNodeyHead(children[mid]);
    var direction = ASTUtils.inRange(midNodey, change);
    //console.log("checking mid range", midNodey, direction);
    if ((min >= max || max <= min) && direction !== 0)
      //end condition no more to explore
      return null;

    if (direction === 0) {
      var midChildren = midNodey.getChildren();
      // it's in this node, check for children to be more specific
      if (midChildren.length < 1) match = midNodey;
      // found!
      else
        match =
          _findNodeAtRange(
            midNodey,
            0,
            Math.max(0, midChildren.length - 1),
            change,
            historyModel
          ) || midNodey; // found!
    } else if (direction === 2) return null;
    // there is no match at this level
    else if (direction === -1)
      // check the left
      match = _findNodeAtRange(node, min, mid - 1, change, historyModel);
    else if (direction === 1)
      // check the right
      match = _findNodeAtRange(node, mid + 1, max, change, historyModel);

    if (match) {
      // if there's a match, now find it's closest parsable parent
      return match; //TODO
    }
    return null;
  }
}

export interface ParserNodey
{
  content?: any[];
  start: {line: number, ch: number};
  end: {line: number, ch: number};
  type?: string;
  literal?: string;
  syntok?: string;
  parent?: number;
}
