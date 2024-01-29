import {useMemo} from "react";
import {ObjectEntryCompositeType, ObjectEntryInformation, ObjectEntryType} from "./types/ObjectEntryInformation.ts";
import ObjectEntryEvent, {ObjectEntryComposite, ObjectEntryValue} from "./types/ObjectEntryEvent.ts";
import ObjectEntryGraph from "./Graph.tsx";

interface GraphListProps {
    information: ObjectEntryInformation,
    nodeName: string,
    useScrolling?: boolean,
}

// This function is not tested property because the backend currently doesn't any
// structures messages!
function GraphList({information, nodeName, useScrolling = true}: GraphListProps) {
    function computeRenderFunc(
        property: (event: ObjectEntryEvent) => ObjectEntryValue,
        ty: ObjectEntryType,
        propertyName?: string,
    ): () => JSX.Element {
        if ((ty as any).name != undefined) {
            let compositeType = information.ty as ObjectEntryCompositeType;

            let renderFuncs = compositeType.attributes.map((attrib, index) => {
                return computeRenderFunc(
                    (event) => (property(event) as ObjectEntryComposite).value[index].value,
                    attrib.type,
                    propertyName ? `${propertyName}.${attrib.name}` : attrib.name
                );
            });

            return () => <> {renderFuncs.map(f => f())}</>;
        } else if (Array.isArray(ty)) {
            // Enum Type
            return () => {
                return <ObjectEntryGraph
                    nodeName={nodeName}
                    objectEntryInformation={information}
                    property={(event) => event.value as number}
                    propertyName={propertyName}
                    useScrolling={useScrolling}
                />
            };
        } else {
            // Primitive type
            return () => {
                return <ObjectEntryGraph
                    nodeName={nodeName}
                    objectEntryInformation={information}
                    property={(event) => event.value as number}
                    propertyName={propertyName}
                    useScrolling={useScrolling}
                />
            };
        }
    }

    let renderFunc = useMemo(() => computeRenderFunc((event) => event.value, information.ty), [nodeName, information.name]);

    return renderFunc();
}

export default GraphList