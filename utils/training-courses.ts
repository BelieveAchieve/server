import { find, chain } from "lodash";

interface TrainingCourse {
  name: string;
  courseKey: string;
  description: string;
  quizKey: string;
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
            name: "Additional Resources",
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
            resourceId: "459021055"
          },
          {
            name: "Guide to choosing your references",
            materialKey: "vrwv5g",
            type: MaterialType.DOCUMENT,
            isRequired: true,
            resourceId: "choosing-references"
          },
          {
            name: "Additional Resources",
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
        moduleKey: "7fj5ck",
        materials: [
          {
            name: "Fulfilling student requests",
            materialKey: "212h45",
            type: MaterialType.VIDEO,
            isRequired: true,
            resourceId: "458744827"
          },
          {
            name: "Additional Resources",
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
      }
    ]
  }
];
