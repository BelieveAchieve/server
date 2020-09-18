import { find, chain } from "lodash";

interface TrainingCourse {
  name: string;
  courseKey: string;
  description: string;
  quizKey: string;
  quizName: string;
  modules: TrainingModule[];
}

interface TrainingModule {
  name: string;
  moduleKey: string;
  materials: TrainingMaterial[];
}

enum MaterialType {
  VIDEO = 'video',
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
  resourceId?: string;
  linkUrl?: string;
  links?: TrainingMaterialLink[];
}

interface TrainingMaterialLink {
  displayName: string;
  url: string;
}

export const getCourse = (courseKey: string): TrainingCourse => {
  return find(courses, { courseKey });
}

const getRequiredMaterials = (courseKey: string): string[] => {
  const course: TrainingCourse = getCourse(courseKey);
  return chain(course.modules)
    .map('materials')
    .flatten()
    .filter('isRequired')
    .map('materialKey')
    .value();
}

export const getProgress = (courseKey: string, userCompleted: string[]): number => {
  const course = getCourse(courseKey);
  const requiredMaterials = getRequiredMaterials(courseKey);
  const completedMaterials = requiredMaterials.filter(mat => userCompleted.includes(mat));
  const fraction = completedMaterials.length / requiredMaterials.length;
  return Math.floor(fraction * 100);
}

export const courses: TrainingCourse[] = [
  {
    name: "UPchieve 101",
    courseKey: "upchieve101",
    description:
      "UPchieve101 is a required training in order to be an Academic Coach. Please complete each Module before completeing the quiz at the bottom.",
    quizKey: "upchieve101",
    quizName: "UPchieve 101 Quiz",
    modules: [
      {
        name: "Intro to UPchieve",
        moduleKey: "4k90tg",
        materials: [
          {
            name: "Welcome to UPchieve!",
            materialKey: "31rgp3",
            type: MaterialType.VIDEO,
            isRequired: true,
            resourceId: "459021055"
          },
          {
            name: "Join the UPchieve Slack community",
            materialKey: "1s3654",
            type: MaterialType.LINK,
            isRequired: false,
            linkUrl:
              "https://join.slack.com/t/upchieveaccommunity/shared_invite/zt-8amwqpm9-fbCn~uRoOHOe27mkx7Ae1w"
          },
          {
            name: "Register for UPchieve's Monthly Coach Meetings",
            materialKey: "42j392",
            type: MaterialType.LINK,
            isRequired: false,
            linkUrl:
              "https://us02web.zoom.us/meeting/register/uZUsduiqrzgiO4_zJG9YvVJcx8vBxt4snA"
          },
          {
            name: "Additional resources",
            materialKey: "90d731",
            type: MaterialType.RESOURCES,
            isRequired: false,
            links: [
              {
                displayName: "UPchieve student testimonials and feedback",
                url: "https://upc-training-materials.s3.us-east-2.amazonaws.com/student-testimonials-and-feedback.pdf"
              },
              {
                displayName: "Overview of inequity in higher education",
                url: "http://pellinstitute.org/downloads/publications-Indicators_of_Higher_Education_Equity_in_the_US_2018_Historical_Trend_Report.pdf"
              },
              {
                displayName: "Overview of COVID-19's impact on education",
                url: "https://www.mckinsey.com/industries/public-and-social-sector/our-insights/covid-19-and-student-learning-in-the-united-states-the-hurt-could-last-a-lifetime"
              }
            ]
          }
        ]
      },
      {
        name: "Becoming an Active Coach",
        moduleKey: "7fj5ck",
        materials: [
          {
            name: "Getting approved and onboarded",
            materialKey: "412g45",
            type: MaterialType.VIDEO,
            isRequired: true,
            resourceId: "458744762"
          },
          {
            name: "Guide to choosing your references",
            materialKey: "vrwv5g",
            type: MaterialType.DOCUMENT,
            isRequired: true,
            resourceId: "choosing-references"
          },
          {
            name: "Additional resources",
            materialKey: "1hh701",
            type: MaterialType.RESOURCES,
            isRequired: false,
            links: [
              {
                displayName: "Approval process demo",
                url: "https://vimeo.com/451872809"
              },
              {
                displayName: "Onboarding process demo",
                url: "https://vimeo.com/451872896"
              }
            ]
          }
        ]
      },
      {
        name: "Helping Your First Student",
        moduleKey: "8fh5ck",
        materials: [
          {
            name: "Fulfilling student requests",
            materialKey: "212h45",
            type: MaterialType.VIDEO,
            isRequired: true,
            resourceId: "458744827"
          },
          {
            name: "Additional resources",
            materialKey: "g0g710",
            type: MaterialType.RESOURCES,
            isRequired: false,
            links: [
              {
                displayName: "Tutoring session demo",
                url: "https://vimeo.com/457909355"
              },
              {
                displayName: "College counseling session demo",
                url: "https://vimeo.com/457909309"
              }
            ]
          }
        ]
      },
      {
        name: "Student Safety",
        moduleKey: "hf7ek9",
        materials: [
          {
            name: "Keeping students safe",
            materialKey: "839fi9",
            type: MaterialType.VIDEO,
            isRequired: true,
            resourceId: "458744863"
          },
          {
            name: "UPchieve Student Safety Policy",
            materialKey: "ps87f9",
            type: MaterialType.DOCUMENT,
            isRequired: true,
            resourceId: "student-safety-policy"
          },
          {
            name: "Guide to personal questions",
            materialKey: "c8cjre",
            type: MaterialType.DOCUMENT,
            isRequired: true,
            resourceId: "personal-questions"
          }
        ]
      },
      {
        name: "Academic Integrity",
        moduleKey: "g7sk9f",
        materials: [
          {
            name: "Maintaining academic integrity",
            materialKey: "jgu55k",
            type: MaterialType.VIDEO,
            isRequired: true,
            resourceId: "459021109"
          },
          {
            name: "UPchieve Academic Integrity Policy",
            materialKey: "3gh7dh",
            type: MaterialType.DOCUMENT,
            isRequired: true,
            resourceId: "academic-integrity"
          },
          {
            name: "Examples of cheating",
            materialKey: "1w5fp0",
            type: MaterialType.DOCUMENT,
            isRequired: true,
            resourceId: "cheating-examples"
          }
        ]
      },
      {
        name: "Diversity, Equity, and Inclusion",
        moduleKey: "fj6ku9",
        materials: [
          {
            name: "Incorporating DEI into your coaching",
            materialKey: "chduq3",
            type: MaterialType.VIDEO,
            isRequired: true,
            resourceId: "459021056"
          },
          {
            name: "UPchieve DEI Policy",
            materialKey: "fj8tzq",
            type: MaterialType.DOCUMENT,
            isRequired: true,
            resourceId: "dei-policy"
          },
          {
            name: "Complete implicit bias training",
            materialKey: "k3k37t",
            type: MaterialType.LINK,
            isRequired: true,
            linkUrl:
              "http://kirwaninstitute.osu.edu/implicit-bias-training/"
          },
          {
            name: "Take the race IAT",
            materialKey: "sk8lyf",
            type: MaterialType.LINK,
            isRequired: true,
            linkUrl:
              "https://implicit.harvard.edu/implicit/selectatest.html"
          },
          {
            name: "Additional resources",
            materialKey: "g34kfx",
            type: MaterialType.RESOURCES,
            isRequired: false,
            links: [
              {
                displayName: "Examples of microaggressions",
                url: "https://sph.umn.edu/site/docs/hewg/microaggressions.pdf"
              },
              {
                displayName: "Examples of how implicit bias can influence educators' behavior",
                url: "https://poorvucenter.yale.edu/ImplicitBiasAwareness"
              },
              {
                displayName: "Podcast on desegregation",
                url: "https://www.thisamericanlife.org/562/the-problem-we-all-live-with-part-one"
              }
            ]
          }
        ]
      },
      {
        name: "Worst Case Scenarios",
        moduleKey: "j694uj",
        materials: [
          {
            name: "Handling worst case scenarios",
            materialKey: "xgvd64",
            type: MaterialType.VIDEO,
            isRequired: true,
            resourceId: "458744858"
          },
          {
            name: "More tips on handling challenging scenarios",
            materialKey: "jkkm20",
            type: MaterialType.DOCUMENT,
            isRequired: true,
            resourceId: "challenging-scenarios"
          }
        ]
      }
    ]
  }
];
