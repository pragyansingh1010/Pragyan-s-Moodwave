def clean_mood(mood):
    return mood.strip().lower()

assert clean_mood(' Happy ') == 'happy'
assert clean_mood('SAD') == 'sad'
