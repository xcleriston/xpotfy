from setuptools import setup, find_packages

setup(
    name="google-calendar-integrator",
    version="1.0.0",
    description="Integrador de Planilha com Google Agenda",
    author="Seu Nome",
    author_email="seu.email@exemplo.com",
    packages=find_packages(),
    install_requires=[
        "google-api-python-client>=2.108.0",
        "google-auth-httplib2>=0.1.1",
        "google-auth-oauthlib>=1.1.0",
        "pandas>=2.1.4",
        "openpyxl>=3.1.2",
        "python-dateutil>=2.8.2",
        "geopy>=2.4.1",
        "requests>=2.31.0"
    ],
    python_requires=">=3.7",
    entry_points={
        "console_scripts": [
            "calendar-integrator=main:main",
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: End Users/Desktop",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
)
