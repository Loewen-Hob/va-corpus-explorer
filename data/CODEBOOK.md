# Corpus coding definitions

## VA stages

- **DP — Data processing:** Acquiring, extracting, cleaning, restructuring, or computing data before visual encoding. Selecting a subset within an existing view alone does not qualify.
- **VM — Visual mapping:** Creating or revising mappings from data to marks, channels, or chart structures. Inspecting or annotating a chart alone does not qualify.
- **VT — View transformation:** Changing the focus, subset, granularity, arrangement, or navigational state of a view for exploration. Producing a new encoding is visual mapping instead.
- **PR — Presentation:** Externalizing an interpretation through explanatory text, annotations, summaries, or reports. Merely displaying or exporting a chart, or authoring a question about one, does not qualify.

## Interaction modes

- **G — Guiding:** Providing a goal, prompt, example, constraint, or selected input context for the model’s next output. The user does not directly edit a model-produced artifact in this action.
- **S — Selecting or rating:** Choosing, accepting, rejecting, or evaluating a model-produced candidate or suggestion. Selecting source data or navigating a view is insufficient.
- **P — Post-editing:** Directly changing a model-produced artifact, with the edit remaining local or final rather than becoming input for model continuation. Asking the model to make the change is guiding.
- **I — Interactive editing:** Directly revising a model-produced draft or identified part, after which the system feeds that revision to the model and the model continues or regenerates from it. A new question or retry without editing the draft is insufficient.
- **U — User-led presentation authoring:** Retaining authorship of an analytic explanation, report, dashboard text, data story, or text–visual account while the model suggests or continues material. An automatically drafted report without user-led composition is excluded. U applies only to PR.

## Counting and interpretation

- The crosswalk records documented active intervention targeting an LLM-related artifact, rather than all capabilities reported by a system.
- An action is assigned only to the stage it directly targets; an automatic downstream result does not inherit the action’s mode.
- A paper contributes at most once to a stage–mode cell. Distinct documented actions may place a paper in multiple cells.
- Stage and mode totals count distinct papers. They are not sums of the corresponding cells.
- U outside PR is structurally inapplicable (NA), rather than an observed zero.
- An empty crosswalk field means no matching action is recorded. It does not prove a capability is absent from the implementation.
- Evidence strings are supplied coding summaries, not verbatim quotations. Section/page locators are not supplied in the source CSV.
- The explorer uses consensus labels; independent coder labels are not available here and agreement coefficients are not recalculated.

Stage framework: Luo et al., https://arxiv.org/abs/2604.15813. Interaction modes adapted from Cheng et al. (2022), https://aclanthology.org/2022.naacl-main.33/.
