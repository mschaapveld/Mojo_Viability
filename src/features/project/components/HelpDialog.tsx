import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Guide</DialogTitle>
          <DialogDescription>
            Learn how to use the business viability tools
          </DialogDescription>
        </DialogHeader>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="getting-started">
            <AccordionTrigger>Getting Started</AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm">
              <p>Welcome to MojoBusiness.ai! Start by selecting your period (Weekly, Monthly, or Yearly) in the header.</p>
              <p>All calculations automatically adjust based on your chosen period, making it easy to model your business at different scales.</p>
              <p>Use the tabs to navigate between different planning tools, starting with Simple Break-Even for quick insights.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="simple-breakeven">
            <AccordionTrigger>Simple Break-Even Analysis</AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm">
              <p><strong>Purpose:</strong> Quickly determine if your business concept can break even and be profitable.</p>
              <p><strong>How to use:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Enter your expected sales revenue</li>
                <li>Set your desired owner's return (profit/salary)</li>
                <li>Enter fixed costs like rent</li>
                <li>Set variable costs as percentages (COGS, Labour, Other)</li>
              </ul>
              <p>The tool instantly shows you if your business model is viable and what your break-even sales target is.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="detailed-breakeven">
            <AccordionTrigger>Detailed Break-Even Analysis</AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm">
              <p><strong>Purpose:</strong> Compare three different options side-by-side with detailed cost breakdowns.</p>
              <p><strong>Additional features:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Add custom fixed costs specific to your business</li>
                <li>Include insurance, accounting, marketing, and utilities</li>
                <li>Set minimum labour costs to ensure staffing</li>
                <li>Compare optimistic, realistic, and conservative options</li>
              </ul>
              <p>Use this for comprehensive financial planning when you have more detailed cost information.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="fitout-financing">
            <AccordionTrigger>Fitout & Financing</AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm">
              <p><strong>Purpose:</strong> Calculate startup costs and financing requirements for new or existing sites.</p>
              <p><strong>Features:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Track equipment, furniture, technology, and fitout costs</li>
                <li>Calculate loan repayments with balloon payment options</li>
                <li>Compare three options for different funding approaches</li>
                <li>See how loan repayments impact your cash flow</li>
                <li>Add custom setup costs unique to your business</li>
              </ul>
              <p>Essential for understanding total investment and financing options.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="hours-operation">
            <AccordionTrigger>Hours of Operation</AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm">
              <p><strong>Purpose:</strong> Define when your business is open and operating throughout the week.</p>
              <p><strong>How to use:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Toggle days open or closed</li>
                <li>Set service period times (breakfast, lunch, dinner)</li>
                <li>Define prep and shutdown times</li>
                <li>Copy schedules between days for consistency</li>
              </ul>
              <p>This data feeds into the Sales Breakup analysis for accurate revenue forecasting.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sales-breakup">
            <AccordionTrigger>Sales Breakup Analysis</AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm">
              <p><strong>Purpose:</strong> Distribute your sales across days and service periods to understand revenue patterns.</p>
              <p><strong>Features:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Set weekly sales targets</li>
                <li>Allocate sales percentages by day (automatically validates to 100%)</li>
                <li>Break down sales by service period (breakfast, lunch, dinner)</li>
                <li>Visual charts show your sales distribution</li>
              </ul>
              <p>Helps identify peak periods and plan staffing and inventory accordingly.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="save-load">
            <AccordionTrigger>Saving & Loading Projects</AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm">
              <p><strong>Sign in required:</strong> Create a free account to save your work to the cloud.</p>
              <p><strong>Features:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Save:</strong> Store your current project with all data</li>
                <li><strong>Load:</strong> Access any previously saved project</li>
                <li><strong>New:</strong> Start fresh with a blank project</li>
                <li>Create multiple projects to compare different business models</li>
                <li>Rename projects to keep them organized</li>
              </ul>
              <p>Your projects are securely stored and accessible from any device.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="exporting">
            <AccordionTrigger>Exporting Your Work</AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm">
              <p><strong>Export formats available:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Excel (.xlsx):</strong> Full data export with all calculations (requires sign-in)</li>
                <li><strong>PDF:</strong> Professional formatted report for presentations (requires sign-in)</li>
                <li><strong>JSON:</strong> Raw data format for backups or integrations (requires sign-in)</li>
                <li><strong>Simple Break-Even:</strong> Quick PDF or Excel export without sign-in</li>
              </ul>
              <p>Use exports to share with partners, investors, or advisors.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="keyboard-shortcuts">
            <AccordionTrigger>Keyboard Shortcuts</AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm">
              <p>Speed up your workflow with these shortcuts:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><kbd className="px-2 py-1 bg-slate-100 border rounded text-xs font-mono">Ctrl/⌘ + S</kbd> - Save project</li>
                <li><kbd className="px-2 py-1 bg-slate-100 border rounded text-xs font-mono">Ctrl/⌘ + O</kbd> - Load project</li>
                <li><kbd className="px-2 py-1 bg-slate-100 border rounded text-xs font-mono">Ctrl/⌘ + N</kbd> - New project</li>
                <li><kbd className="px-2 py-1 bg-slate-100 border rounded text-xs font-mono">Ctrl/⌘ + E</kbd> - Export</li>
                <li><kbd className="px-2 py-1 bg-slate-100 border rounded text-xs font-mono">Ctrl/⌘ + /</kbd> - Show help</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="tips">
            <AccordionTrigger>Tips & Best Practices</AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm">
              <ul className="list-disc pl-5 space-y-1">
                <li>Start with Simple Break-Even to validate your concept quickly</li>
                <li>Create three options: optimistic, realistic, and conservative</li>
                <li>Review all costs carefully - underestimating can lead to surprises</li>
                <li>Use realistic sales figures based on market research</li>
                <li>Factor in seasonal variations in the Sales Breakup</li>
                <li>Save multiple versions as your plan evolves</li>
                <li>Export to PDF to share with advisors or lenders</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="changelog">
            <AccordionTrigger>Changelog</AccordionTrigger>
            <AccordionContent className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold">v1.0.2 - UI Improvements</h3>
                <p className="text-slate-600">Moved changelog to Help dialog, increased tab button heights, added white text on hover for inactive tabs, and enhanced Excel export with period-aware scaling and improved header styling</p>
              </div>
              <div>
                <h3 className="font-semibold">v1.0.1 - Style Updates</h3>
                <p className="text-slate-600">Improved button styling consistency across dialogs</p>
              </div>
              <div>
                <h3 className="font-semibold">v1.0.0 - Initial Release</h3>
                <p className="text-slate-600">MojoBusiness.ai launched with core features</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DialogContent>
    </Dialog>
  );
}
