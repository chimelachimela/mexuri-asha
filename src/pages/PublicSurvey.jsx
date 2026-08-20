import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as db from "../lib/services/dbService";
import { SurveyThanksScreen } from "../components/SurveyForm";
import { useSurveyRuntime } from "../lib/templates/useSurveyRuntime";
import { getTemplate } from "../lib/templates/registry";
import { recommendTemplate } from "../lib/templates/compatibility";
import { TEMPLATE_COMPONENTS } from "../components/survey-templates";

export default function PublicSurvey() {
    const { slug } = useParams();
    const [survey, setSurvey] = useState(undefined); // undefined = loading, null = not found

    useEffect(() => {
        db.getSurveyBySlug(slug).then((s) => setSurvey(s && s.status === "published" ? s : null));
    }, [slug]);

    const runtime = useSurveyRuntime(survey, (answers) => db.submitResponse(survey.id, answers));

    if (survey === undefined) {
        return (
            <div className="min-h-screen bg-canvas flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-ink/20 border-t-ink/70 rounded-full animate-spin" />
            </div>
        );
    }

    if (survey === null) {
        return (
            <div className="min-h-screen bg-canvas flex items-center justify-center px-6">
                <div className="text-center max-w-sm">
                    <h1 className="text-xl font-bold mb-2">Survey not found</h1>
                    <p className="text-ink/40 text-sm">
                        This link may be wrong, or the survey isn't published anymore.
                    </p>
                </div>
            </div>
        );
    }

    if (runtime.submitted) {
        return (
            <div className="min-h-screen bg-canvas">
                <SurveyThanksScreen />
            </div>
        );
    }

    // survey.templateId is set at publish time (Asha's recommendation,
    // possibly overridden by the founder in the builder). Fall back to a
    // fresh recommendation if it's missing — e.g. surveys published
    // before templates existed.
    const templateId = survey.templateId || recommendTemplate(survey.questions).id;
    const template = getTemplate(templateId);
    const TemplateComponent = TEMPLATE_COMPONENTS[template.id] || TEMPLATE_COMPONENTS.stack;

    return <TemplateComponent survey={survey} runtime={runtime} />;
}
