import {Highlight, themes, type Language} from "prism-react-renderer";

import {cn} from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language: Language;
  className?: string;
}

export function CodeBlock({code, language, className}: CodeBlockProps) {
  return (
    <Highlight code={code.trimEnd()} language={language} theme={themes.vsLight}>
      {({className: highlightClassName, style, tokens, getLineProps, getTokenProps}) => (
        <pre className={cn("overflow-auto rounded-md border p-3 text-sm", highlightClassName, className)} style={style}>
          {tokens.map((line, lineIndex) => {
            const lineProps = getLineProps({line});
            return (
              <div key={lineIndex} {...lineProps}>
                {line.length === 0 ? (
                  <span> </span>
                ) : (
                  line.map((token, tokenIndex) => {
                    const tokenProps = getTokenProps({token});
                    return <span key={tokenIndex} {...tokenProps} />;
                  })
                )}
              </div>
            );
          })}
        </pre>
      )}
    </Highlight>
  );
}
