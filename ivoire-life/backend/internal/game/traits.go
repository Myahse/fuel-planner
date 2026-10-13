package game

type Option struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Icon  string `json:"icon"`
	Hint  string `json:"hint"`
}

// Traits shape a Sim's personality. A Sim picks up to MaxTraits of them.
// They are cosmetic for now; gameplay bonuses will hook in here.
var Traits = []Option{
	{ID: "ambianceur", Label: "Ambianceur", Icon: "🎉", Hint: "Toujours là où ça bouge."},
	{ID: "travailleur", Label: "Travailleur", Icon: "💼", Hint: "Le boulot d'abord."},
	{ID: "gourmand", Label: "Gourmand", Icon: "🍗", Hint: "Garba matin, midi et soir."},
	{ID: "dormeur", Label: "Gros dormeur", Icon: "😴", Hint: "La sieste est sacrée."},
	{ID: "sportif", Label: "Sportif", Icon: "⚽", Hint: "Foot tous les dimanches."},
	{ID: "pieux", Label: "Pieux", Icon: "🙏", Hint: "Jamais sans sa prière."},
	{ID: "econome", Label: "Économe", Icon: "🪙", Hint: "Chaque franc compte."},
	{ID: "artiste", Label: "Artiste", Icon: "🎨", Hint: "Zouglou dans le sang."},
	{ID: "dragueur", Label: "Charmeur", Icon: "😏", Hint: "Le verbe facile."},
}

const MaxTraits = 3

var Aspirations = []Option{
	{ID: "boss", Label: "Boss du Plateau", Icon: "🏙️", Hint: "Monter les échelons jusqu'au dernier étage."},
	{ID: "ambiance", Label: "Roi de l'ambiance", Icon: "🪩", Hint: "Être connu dans tous les maquis de Babi."},
	{ID: "commerce", Label: "Grand commerçant", Icon: "🧺", Hint: "De la petite table au grand magasin."},
	{ID: "foot", Label: "Star du foot", Icon: "🏆", Hint: "Porter le maillot des Éléphants."},
	{ID: "famille", Label: "Pilier de la famille", Icon: "👨‍👩‍👧", Hint: "Une grande cour pleine d'enfants."},
}

func ValidOption(opts []Option, id string) bool {
	for _, o := range opts {
		if o.ID == id {
			return true
		}
	}
	return false
}
