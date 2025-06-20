import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ConverterSection } from '@/components/markdown-html-tool/convert-section';
import { CompareSection } from '@/components/markdown-html-tool/compare-section';

export default function MarkdownToolsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary-foreground mb-8">Markdown/HTML Tools</h1>
      
      <Accordion type="multiple" className="w-full space-y-6">
        <AccordionItem value="conversion">
          <AccordionTrigger className="text-lg px-4">Markdown/HTML Conversion</AccordionTrigger>
          <AccordionContent className="pt-4 px-4">
            <ConverterSection />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="comparison">
          <AccordionTrigger className="text-lg px-4">Markdown Comparison</AccordionTrigger>
          <AccordionContent className="pt-4 px-4">
            <CompareSection />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
