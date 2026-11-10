// guides a new task can follow; their text lives under task_panel.guides in en.json
const GUIDES = [
  {
    id: "selection_plan_setup",
    steps: [
      {
        id: "marketing",
        link: (summitId) => `/app/summits/${summitId}/marketing`,
        instructions: ["find", "upload"]
      },
      {
        id: "activity_categories",
        link: (summitId) => `/app/summits/${summitId}/event-categories`,
        instructions: ["add", "capacity", "visible"]
      },
      {
        id: "category_groups",
        link: (summitId) => `/app/summits/${summitId}/event-category-groups`,
        instructions: ["add", "categories"]
      },
      {
        id: "media_upload_types",
        link: () => "/app/media-file-types",
        instructions: ["add", "storage"]
      },
      {
        id: "activity_types",
        link: (summitId) => `/app/summits/${summitId}/event-types`,
        instructions: ["add", "speakers", "uploads"]
      },
      {
        id: "email_templates",
        link: () => "/app/emails/templates",
        instructions: ["add", "preview"]
      },
      {
        id: "email_events",
        link: (summitId) => `/app/summits/${summitId}/email-flow-events`,
        instructions: ["find", "template"]
      },
      {
        id: "selection_plan",
        link: (summitId) => `/app/summits/${summitId}/selection-plans`,
        // one per tab of the selection plan editor
        substeps: [
          "main",
          "category_groups",
          "activity_types",
          "extra_questions",
          "email_templates",
          "track_chairs",
          "progress_flags",
          "cfp_settings"
        ]
      },
      {
        id: "event_docs",
        link: (summitId) => `/app/summits/${summitId}/summitdocs`,
        optional: true,
        instructions: ["add"]
      },
      {
        id: "running_the_plan",
        instructions: ["move_rejects", "rename", "reopen", "emails"]
      }
    ]
  }
];

// a step with substeps is ticked through them, so its keys are theirs
export const stepKeys = (step) =>
  step.substeps
    ? step.substeps.map((substep) => `${step.id}.${substep}`)
    : [step.id];

export const isStepDone = (step, done) =>
  stepKeys(step).every((key) => done[key]);

export const doneStepCount = (steps, done) =>
  steps.filter((step) => isStepDone(step, done)).length;

export default GUIDES;
