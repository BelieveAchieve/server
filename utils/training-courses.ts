import { find } from "lodash";

interface TrainingCourse {
  name: string;
  courseKey: string;
  description: string;
  modules: TrainingModule[];
}

interface TrainingModule {
  name: string;
  moduleKey: string;
  materials: TrainingMaterial[];
}

enum MaterialType {
  VIDEO = 'video',
  SLIDESHOW = 'slideshow',
  DOCUMENT = 'document',
  LINK = 'link',
  RESOURCES = 'resources'
}

interface TrainingMaterial {
  name: string;
  description?: string;
  materialKey: string;
  isRequired: boolean;
  type: MaterialType;
  resourceUrl?: string;
  links?: TrainingMaterialLink[];
}

interface TrainingMaterialLink {
  displayName: string;
  url: string;
}

export const getCourse = (courseKey: string): TrainingCourse => {
  return find(courses, { courseKey });
}

export const courses: TrainingCourse[] = [
  {
    name: "UPchieve 101",
    courseKey: "upchieve101",
    description:
      "UPchieve101 is a required training in order to be an Academic Coach. Please complete each Module before completeing the quiz at the bottom.",
    modules: [
      {
        name: "Module 1",
        moduleKey: "4k90tg",
        materials: [
          {
            name: "Intro Video",
            description: "Material description",
            materialKey: "31rgp3",
            type: MaterialType.VIDEO,
            isRequired: true,
            resourceUrl: "https://www.youtube.com/watch?v=VjZzfgqno2A"
          },
          {
            name: "Coach Guide",
            materialKey: "1s3654",
            type: MaterialType.DOCUMENT,
            isRequired: true,
            resourceUrl:
              "https://app.upchieve.org/cc4c54987cdaeac2653be81033aa95ff.pdf"
          },
          {
            name: "How to complete a session on UPchieve",
            description: "Material description",
            materialKey: "42j392",
            type: MaterialType.DOCUMENT,
            isRequired: true,
            resourceUrl:
              "https://app.upchieve.org/cc4c54987cdaeac2653be81033aa95ff.pdf"
          },
          {
            name: "About our students",
            description: "Material description",
            materialKey: "413g67",
            type: MaterialType.SLIDESHOW,
            isRequired: false,
            resourceUrl:
              "https://app.upchieve.org/cc4c54987cdaeac2653be81033aa95ff.pdf"
          },
          {
            name: "Donate to UPchieve",
            description: "Click this link to donate",
            materialKey: "6a3231",
            type: MaterialType.LINK,
            isRequired: true,
            resourceUrl:
              "https://upchieve.org/donate"
          },
          {
            name: "More resources",
            description: "Here are more resources",
            materialKey: "90d731",
            type: MaterialType.RESOURCES,
            isRequired: false,
            links: [
              {
                displayName: "Differential equation introduction",
                url: "https://www.youtube.com/watch?v=6o7b9yyhH7k"
              },
              {
                displayName: "Implicit Bias",
                url: "https://www.youtube.com/watch?v=kKHSJHkPeLY"
              }
            ]
          }
        ]
      },
      {
        name: "Module 2",
        moduleKey: "gfw567",
        materials: [
          {
            name: "Intro Video",
            materialKey: "412g45",
            type: MaterialType.VIDEO,
            isRequired: true,
            resourceUrl: "https://www.youtube.com/watch?v=VjZzfgqno2A"
          },
          {
            name: "Coach Guide",
            description: "Material description",
            materialKey: "vrwv5g",
            type: MaterialType.DOCUMENT,
            isRequired: true,
            resourceUrl:
              "https://app.upchieve.org/cc4c54987cdaeac2653be81033aa95ff.pdf"
          },
          {
            name: "How to complete a session on UPchieve",
            materialKey: "5ggwf3",
            type: MaterialType.DOCUMENT,
            isRequired: true,
            resourceUrl:
              "https://app.upchieve.org/cc4c54987cdaeac2653be81033aa95ff.pdf"
          },
          {
            name: "About our students",
            description: "Material description",
            materialKey: "jtyeh3",
            type: MaterialType.SLIDESHOW,
            isRequired: false,
            resourceUrl:
              "https://app.upchieve.org/cc4c54987cdaeac2653be81033aa95ff.pdf"
          }
        ]
      }
    ]
  }
];
